from PyQt6.QtGui import QColor

# File configuration
DATA_FILE = "headsets.json"

# Default priority order: smaller number = higher priority
DEFAULT_PRIORITY = {"Quest3": 1, "Quest2": 2, "HTC_Vive_XR": 3}

# Colors for different states RGB
COLOR_IN_USE = QColor(255, 120, 120)
COLOR_AVAILABLE = QColor(120, 255, 120)
COLOR_ACCOUNT_BLOCKED = QColor(255, 140, 0)
COLOR_SUGGESTED = QColor(120, 255, 120)

# UI Constants
TABLE_COLUMNS = ["ID", "Model", "Account", "Status", "Priority"]
TABLE_COLUMN_COUNT = len(TABLE_COLUMNS)
SUGGESTED_STYLE = (
    "background: #dfffd6; color: black; font-size: 16px; font-weight: bold;"
)
NO_AVAILABLE_STYLE = (
    "background: #ffd6d6; color: black; font-size: 16px; font-weight: bold;"
)
DEFAULT_STYLE = "font-size: 16px; font-weight: bold; padding: 8px;"

# Status text constants
STATUS_IN_USE = "In Use"
STATUS_ACCOUNT_IN_USE = "Account in use"
STATUS_AVAILABLE = "Available"
