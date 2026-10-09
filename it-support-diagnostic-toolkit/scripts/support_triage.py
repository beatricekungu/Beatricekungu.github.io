"""Collect safe, read-only system information for an IT support ticket."""

import getpass
import ipaddress
import platform
import re
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path


DISK_WARNING_THRESHOLD = 85.0
HTTPS_TEST_URL = "https://example.com"


def format_duration(total_seconds):
    """Convert a duration in seconds into a readable support-report value."""
    total_seconds = max(0, int(total_seconds))
    days, remainder = divmod(total_seconds, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, _ = divmod(remainder, 60)

    parts = []
    if days:
        parts.append(f"{days} day{'s' if days != 1 else ''}")
    if hours:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    return ", ".join(parts)


def get_uptime():
    """Return system uptime without changing system settings."""
    operating_system = platform.system()

    try:
        if operating_system == "Darwin":
            result = subprocess.run(
                ["sysctl", "-n", "kern.boottime"],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )
            if result.returncode != 0:
                error = result.stderr.strip() or "sysctl returned no details"
                return f"Unavailable ({error})"

            match = re.search(r"sec\s*=\s*(\d+)", result.stdout)
            if not match:
                return "Unavailable (could not read the macOS boot time)"

            boot_time = int(match.group(1))
            return format_duration(time.time() - boot_time)

        if operating_system == "Windows":
            import ctypes

            milliseconds = ctypes.windll.kernel32.GetTickCount64()
            return format_duration(milliseconds / 1_000)

        if operating_system == "Linux":
            with open("/proc/uptime", encoding="utf-8") as uptime_file:
                seconds = float(uptime_file.readline().split()[0])
            return format_duration(seconds)

        return "Unavailable (unsupported operating system)"
    except (OSError, ValueError, AttributeError) as error:
        return f"Unavailable ({error})"


def get_operating_system():
    """Return a concise operating-system description."""
    if platform.system() == "Darwin":
        macos_version = platform.mac_ver()[0]
        return f"macOS {macos_version or 'version unavailable'}"

    return f"{platform.system()} {platform.release()}"


def collect_system_information():
    """Collect the device details commonly requested during ticket triage."""
    return {
        "Hostname": socket.gethostname(),
        "Current User": getpass.getuser(),
        "Operating System": get_operating_system(),
        "Python Version": platform.python_version(),
        "Uptime": get_uptime(),
    }


def format_bytes(byte_count):
    """Convert a byte count into a readable storage value."""
    size = float(byte_count)

    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024 or unit == "TB":
            return f"{size:.1f} {unit}"
        size /= 1024


def collect_storage_information():
    """Collect read-only disk usage details for the system drive."""
    storage_target = Path.home().anchor or "/"

    try:
        total, used, free = shutil.disk_usage(storage_target)
        percentage_used = (used / total) * 100 if total else 0.0
        status = "WARN" if percentage_used >= DISK_WARNING_THRESHOLD else "PASS"

        return {
            "Drive Checked": storage_target,
            "Total Space": format_bytes(total),
            "Used Space": format_bytes(used),
            "Free Space": format_bytes(free),
            "Percentage Used": f"{percentage_used:.1f}%",
            "Status": status,
        }
    except OSError as error:
        return {
            "Drive Checked": storage_target,
            "Status": "ERROR",
            "Error": str(error),
        }


def run_read_only_command(command):
    """Run a short, read-only system command and return its output or error."""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as error:
        return None, str(error)

    if result.returncode != 0:
        error = result.stderr.strip() or f"command returned code {result.returncode}"
        return None, error

    return result.stdout, None


def get_local_ip_address():
    """Identify the local IPv4 address selected for outbound traffic."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as connection:
            connection.settimeout(3)
            connection.connect(("1.1.1.1", 443))
            return connection.getsockname()[0]
    except OSError as error:
        return f"Unavailable ({error})"


def get_default_gateway():
    """Read the default gateway using the host operating system's tools."""
    operating_system = platform.system()

    if operating_system == "Darwin":
        output, error = run_read_only_command(["route", "-n", "get", "default"])
        if error:
            return f"Unavailable ({error})"

        match = re.search(r"^\s*gateway:\s*(\S+)", output, re.MULTILINE)
        return match.group(1) if match else "Unavailable (gateway not found)"

    if operating_system == "Windows":
        output, error = run_read_only_command(["route", "print", "0.0.0.0"])
        if error:
            return f"Unavailable ({error})"

        for line in output.splitlines():
            fields = line.split()
            if len(fields) >= 4 and fields[:2] == ["0.0.0.0", "0.0.0.0"]:
                return fields[2]
        return "Unavailable (gateway not found)"

    if operating_system == "Linux":
        output, error = run_read_only_command(["ip", "route", "show", "default"])
        if error:
            return f"Unavailable ({error})"

        match = re.search(r"\bdefault\s+via\s+(\S+)", output)
        return match.group(1) if match else "Unavailable (gateway not found)"

    return "Unavailable (unsupported operating system)"


def valid_ip_address(value):
    """Return an IP address string when the supplied value is valid."""
    candidate = value.strip().split("%", maxsplit=1)[0]
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def get_dns_servers():
    """Read configured DNS servers without changing network settings."""
    operating_system = platform.system()
    dns_servers = []

    if operating_system == "Darwin":
        output, error = run_read_only_command(["scutil", "--dns"])
        if error:
            return f"Unavailable ({error})"

        candidates = re.findall(r"nameserver\[\d+\]\s*:\s*(\S+)", output)
        dns_servers = [address for value in candidates if (address := valid_ip_address(value))]

    elif operating_system == "Windows":
        output, error = run_read_only_command(["ipconfig", "/all"])
        if error:
            return f"Unavailable ({error})"

        reading_dns_servers = False
        for line in output.splitlines():
            if "DNS Servers" in line:
                reading_dns_servers = True
                value = line.split(":", maxsplit=1)[-1]
            elif reading_dns_servers:
                value = line.strip()
            else:
                continue

            address = valid_ip_address(value)
            if address:
                dns_servers.append(address)
            elif reading_dns_servers and "DNS Servers" not in line:
                reading_dns_servers = False

    elif operating_system == "Linux":
        try:
            with open("/etc/resolv.conf", encoding="utf-8") as resolver_file:
                for line in resolver_file:
                    if line.strip().startswith("nameserver"):
                        value = line.split(maxsplit=1)[-1]
                        address = valid_ip_address(value)
                        if address:
                            dns_servers.append(address)
        except OSError as error:
            return f"Unavailable ({error})"
    else:
        return "Unavailable (unsupported operating system)"

    unique_servers = list(dict.fromkeys(dns_servers))
    return ", ".join(unique_servers) if unique_servers else "Unavailable (no DNS servers found)"


def collect_network_information():
    """Collect addressing details used during network troubleshooting."""
    return {
        "Local IP Address": get_local_ip_address(),
        "Default Gateway": get_default_gateway(),
        "DNS Servers": get_dns_servers(),
    }


def check_dns_resolution(hostname="example.com"):
    """Test whether DNS can translate a hostname into an IP address."""
    try:
        address_details = socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM)
        addresses = sorted({details[4][0] for details in address_details})
        return {
            "Status": "PASS",
            "Details": f"{hostname} resolved to {', '.join(addresses)}",
        }
    except socket.gaierror as error:
        return {
            "Status": "FAIL",
            "Details": f"Could not resolve {hostname}: {error}",
        }


def check_internet_connectivity(host="1.1.1.1", port=443):
    """Test basic outbound TCP connectivity without requiring administrator access."""
    try:
        with socket.create_connection((host, port), timeout=5):
            return {
                "Status": "PASS",
                "Details": f"Connected to {host} on TCP port {port}",
            }
    except (OSError, socket.timeout) as error:
        return {
            "Status": "FAIL",
            "Details": f"Could not connect to {host} on TCP port {port}: {error}",
        }


def check_https_connectivity(url=HTTPS_TEST_URL):
    """Confirm that an HTTPS endpoint can be reached and returns a response."""
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "IT-Support-Diagnostic-Toolkit/1.0"},
    )

    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            status_code = response.status

        if 200 <= status_code < 400:
            return {
                "Status": "PASS",
                "Details": f"{url} returned HTTP {status_code}",
            }

        return {
            "Status": "FAIL",
            "Details": f"{url} returned unexpected HTTP {status_code}",
        }
    except urllib.error.HTTPError as error:
        return {
            "Status": "FAIL",
            "Details": f"{url} returned HTTP {error.code}: {error.reason}",
        }
    except urllib.error.URLError as error:
        return {
            "Status": "FAIL",
            "Details": f"Could not reach {url}: {error.reason}",
        }
    except (TimeoutError, socket.timeout) as error:
        return {
            "Status": "FAIL",
            "Details": f"Request to {url} timed out: {error}",
        }
    except OSError as error:
        return {
            "Status": "FAIL",
            "Details": f"HTTPS connection to {url} failed: {error}",
        }


def display_system_information(system_information):
    """Display system information in a readable diagnostic-report format."""
    print("IT SUPPORT DIAGNOSTIC REPORT")
    print("=" * 28)
    print("\nDevice Information")
    print("-" * 18)

    for label, value in system_information.items():
        print(f"{label}: {value}")


def display_storage_information(storage_information):
    """Display disk usage and explain any storage warning."""
    print("\nStorage Information")
    print("-" * 19)

    for label, value in storage_information.items():
        print(f"{label}: {value}")

    if storage_information.get("Status") == "WARN":
        print(
            f"Warning: Disk usage is at or above "
            f"{DISK_WARNING_THRESHOLD:.0f}%. Low storage can affect performance "
            "and software installations."
        )


def display_network_diagnostics(
    network_information,
    dns_result,
    internet_result,
    https_result,
):
    """Display network configuration and connectivity test results."""
    print("\nNetwork Information")
    print("-" * 19)
    for label, value in network_information.items():
        print(f"{label}: {value}")

    print("\nNetwork Checks")
    print("-" * 14)
    print(f"DNS Resolution: {dns_result['Status']}")
    print(f"  {dns_result['Details']}")
    print(f"Internet Connectivity: {internet_result['Status']}")
    print(f"  {internet_result['Details']}")
    print(f"HTTPS Connectivity: {https_result['Status']}")
    print(f"  {https_result['Details']}")


def main():
    """Run the current diagnostic checks."""
    system_information = collect_system_information()
    storage_information = collect_storage_information()
    network_information = collect_network_information()
    dns_result = check_dns_resolution()
    internet_result = check_internet_connectivity()
    https_result = check_https_connectivity()
    display_system_information(system_information)
    display_storage_information(storage_information)
    display_network_diagnostics(
        network_information,
        dns_result,
        internet_result,
        https_result,
    )


if __name__ == "__main__":
    main()
