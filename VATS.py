import sys
import json
import os
import datetime
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QTableWidget, QTableWidgetItem, 
    QPushButton, QVBoxLayout, QWidget, QMessageBox, QLabel, QHBoxLayout
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor

# ---------------- GLOBAL CONFIG ----------------
DATA_FILE = "headsets.json"

# Priority order: smaller number = higher priority
PRIORITY = {
    "Quest3": 1,
    "Quest2": 2,
    "HTC_Vive_XR": 3
}

# Colors for different states RGB
COLOR_IN_USE = QColor(255, 120, 120)     # Red
COLOR_AVAILABLE = QColor(120, 255, 120)  # Green
COLOR_ACCOUNT_BLOCKED = QColor(255, 255, 150)  # Yellow
COLOR_SUGGESTED = QColor(120, 255, 120)  # Light Blue

# ---------------- DATA HELPERS ----------------
def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

# ---------------- LOGIC ----------------
def suggest_headset(headsets):
    """Return the next suggested headset that is actually usable."""
    used_accounts = {h["account_id"] for h in headsets if h["in_use"]}

    available = [
        h for h in headsets 
        if not h["in_use"] and h["account_id"] not in used_accounts
    ]

    if not available:
        return None

    available.sort(key=lambda h: (PRIORITY.get(h["model"], 999), h["last_used"]))
    return available[0]

# ---------------- MAIN GUI ----------------
class HeadsetManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("VR Lab Headset Manager")
        self.resize(750, 450)

        self.data = load_data()

        # Layout
        layout = QVBoxLayout()
        
        # Suggested headset banner
        self.suggest_label = QLabel()
        self.suggest_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.suggest_label.setStyleSheet("font-size: 16px; font-weight: bold; padding: 8px;")
        layout.addWidget(self.suggest_label)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["ID", "Model", "Account", "Status"])
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QTableWidget.SelectionMode.ExtendedSelection)
        self.table.cellDoubleClicked.connect(self.toggle_headset)
        layout.addWidget(self.table)

        # Buttons
        button_layout = QHBoxLayout()
        checkout_btn = QPushButton("Checkout Selected")
        return_btn = QPushButton("Return Selected")
        refresh_btn = QPushButton("Refresh")
        checkout_btn.clicked.connect(self.checkout_selected)
        return_btn.clicked.connect(self.return_selected)
        refresh_btn.clicked.connect(self.refresh)
        button_layout.addWidget(checkout_btn)
        button_layout.addWidget(return_btn)
        button_layout.addWidget(refresh_btn)
        layout.addLayout(button_layout)

        # Central Widget
        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.refresh()

    # -------- Core Logic --------
    def refresh(self):
        self.table.setRowCount(len(self.data))
        used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
        suggestion = suggest_headset(self.data)
        suggested_id = suggestion["id"] if suggestion else None

        for row, h in enumerate(self.data):
            id_item = QTableWidgetItem(h["id"])
            model_item = QTableWidgetItem(h["model"])
            account_item = QTableWidgetItem(h["account_id"])

            # Determine status
            if h["in_use"]:
                status_text = "In Use"
                color = COLOR_IN_USE
            elif h["account_id"] in used_accounts:
                status_text = "Account in use"
                color = COLOR_ACCOUNT_BLOCKED
            else:
                status_text = "Available"
                color = COLOR_AVAILABLE

            status_item = QTableWidgetItem(status_text)
            status_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)
            status_item.setBackground(color)

            # Place items
            self.table.setItem(row, 0, id_item)
            self.table.setItem(row, 1, model_item)
            self.table.setItem(row, 2, account_item)
            self.table.setItem(row, 3, status_item)

            # 🔵 Highlight the suggested headset row
            if h["id"] == suggested_id:
                for col in range(4):
                    self.table.item(row, col).setBackground(COLOR_SUGGESTED)

        # Suggested headset banner
        if suggestion:
            self.suggest_label.setText(
                f"Suggested Next Headset: {suggestion['id']} ({suggestion['model']})"
            )
            self.suggest_label.setStyleSheet("background: #dfffd6; color: black; font-size: 16px; font-weight: bold;")
        else:
            self.suggest_label.setText("No Headsets Available")
            self.suggest_label.setStyleSheet("background: #ffd6d6; color: black; font-size: 16px; font-weight: bold;")

        save_data(self.data)

    def checkout_selected(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset.")
            return

        used_accounts = {h["account_id"] for h in self.data if h["in_use"]}

        for idx in selected:
            i = idx.row()
            if self.data[i]["in_use"]:
                continue
            if self.data[i]["account_id"] in used_accounts:
                QMessageBox.critical(
                    self, "Error", f"Account {self.data[i]['account_id']} already in use! Can't use {self.data[i]['id']}."
                )
                continue
            self.data[i]["in_use"] = True
            self.data[i]["last_used"] = datetime.datetime.now().isoformat()
            used_accounts.add(self.data[i]["account_id"])

        self.refresh()

    def return_selected(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset.")
            return

        for idx in selected:
            i = idx.row()
            if self.data[i]["in_use"]:
                self.data[i]["in_use"] = False

        self.refresh()

    def toggle_headset(self, row, col):
        """Double click to quickly checkout/return"""
        if self.data[row]["in_use"]:
            self.data[row]["in_use"] = False
        else:
            used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
            if self.data[row]["account_id"] in used_accounts:
                QMessageBox.critical(
                    self, "Error", f"Account {self.data[row]['account_id']} already in use! Can't use {self.data[row]['id']}."
                )
                return
            self.data[row]["in_use"] = True
            self.data[row]["last_used"] = datetime.datetime.now().isoformat()
        self.refresh()

# ---------------- RUN ----------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = HeadsetManager()
    window.show()
    sys.exit(app.exec())
