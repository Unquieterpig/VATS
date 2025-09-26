import sys
import json
import os
import datetime
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QTableWidget, QTableWidgetItem, 
    QPushButton, QVBoxLayout, QWidget, QMessageBox, QLabel, QHBoxLayout,
    QCheckBox, QSpinBox, QDialog, QFormLayout, QDialogButtonBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor

# ---------------- GLOBAL CONFIG ----------------
DATA_FILE = "headsets.json"

# Default priority order: smaller number = higher priority
DEFAULT_PRIORITY = {
    "Quest3": 1,
    "Quest2": 2,
    "HTC_Vive_XR": 3
}

# Colors for different states RGB
COLOR_IN_USE = QColor(255, 120, 120)     # Red
COLOR_AVAILABLE = QColor(120, 255, 120)  # Green
COLOR_ACCOUNT_BLOCKED = QColor(255, 140, 0)  # Yellow
COLOR_SUGGESTED = QColor(120, 255, 120)  # Green

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

    def get_priority(headset):
        if "custom_priority" in headset:
            return headset["custom_priority"]
        return DEFAULT_PRIORITY.get(headset["model"], 999)
    
    available.sort(key=lambda h: (get_priority(h), h["last_used"]))
    return available[0]

# ---------------- PRIORITY DIALOG ----------------
class PriorityDialog(QDialog):
    def __init__(self, headset, parent=None):
        super().__init__(parent)
        self.headset = headset
        self.setWindowTitle(f"Set Priority for {headset['id']}")
        self.setModal(True)
        self.resize(300, 150)
        
        layout = QFormLayout()
        
        # Current info
        info_label = QLabel(f"Model: {headset['model']}")
        layout.addRow("Model:", info_label)
        
        # Priority input
        self.priority_spin = QSpinBox()
        self.priority_spin.setRange(1, 100)
        self.priority_spin.setValue(headset.get("custom_priority", DEFAULT_PRIORITY.get(headset["model"], 999)))
        self.priority_spin.setToolTip("Lower numbers = higher priority (1 = highest priority)")
        layout.addRow("Priority:", self.priority_spin)
        
        # Buttons
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addRow(buttons)
        
        self.setLayout(layout)
    
    def get_priority(self):
        return self.priority_spin.value()

# ---------------- MAIN GUI ----------------
class HeadsetManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("VATS")
        self.resize(750, 450)

        self.data = load_data()
        self.hide_account_in_use = False

        # Layout
        layout = QVBoxLayout()
        
        # Filter controls
        filter_layout = QHBoxLayout()
        self.hide_filter_checkbox = QCheckBox("Hide 'Account in Use' headsets")
        self.hide_filter_checkbox.stateChanged.connect(self.toggle_filter)
        filter_layout.addWidget(self.hide_filter_checkbox)
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        
        # Suggested headset banner
        self.suggest_label = QLabel()
        self.suggest_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.suggest_label.setStyleSheet("font-size: 16px; font-weight: bold; padding: 8px;")
        layout.addWidget(self.suggest_label)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(5)  # Added Priority column
        self.table.setHorizontalHeaderLabels(["ID", "Model", "Account", "Status", "Priority"])
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QTableWidget.SelectionMode.ExtendedSelection)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.cellDoubleClicked.connect(self.toggle_headset)
        layout.addWidget(self.table)

        # Buttons
        button_layout = QHBoxLayout()
        checkout_btn = QPushButton("Checkout Selected")
        return_btn = QPushButton("Return Selected")
        priority_btn = QPushButton("Set Priority")
        refresh_btn = QPushButton("Refresh")
        checkout_btn.clicked.connect(self.checkout_selected)
        return_btn.clicked.connect(self.return_selected)
        priority_btn.clicked.connect(self.set_priority)
        refresh_btn.clicked.connect(self.refresh)
        button_layout.addWidget(checkout_btn)
        button_layout.addWidget(return_btn)
        button_layout.addWidget(priority_btn)
        button_layout.addWidget(refresh_btn)
        layout.addLayout(button_layout)

        # Central Widget
        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.refresh()

    # -------- Core Logic --------
    def refresh(self):
        # Filter data based on checkbox state
        filtered_data = self.data
        if self.hide_account_in_use:
            used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
            filtered_data = [h for h in self.data if not (h["account_id"] in used_accounts and not h["in_use"])]
        
        self.table.setRowCount(len(filtered_data))
        used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
        suggestion = suggest_headset(self.data)
        suggested_id = suggestion["id"] if suggestion else None

        for row, h in enumerate(filtered_data):
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

            # Priority column
            def get_priority_display(headset):
                if "custom_priority" in headset:
                    return f"{headset['custom_priority']} (Custom)"
                return f"{DEFAULT_PRIORITY.get(headset['model'], 999)} (Default)"
            
            priority_item = QTableWidgetItem(get_priority_display(h))
            priority_item.setTextAlignment(Qt.AlignmentFlag.AlignCenter)

            # Place items
            self.table.setItem(row, 0, id_item)
            self.table.setItem(row, 1, model_item)
            self.table.setItem(row, 2, account_item)
            self.table.setItem(row, 3, status_item)
            self.table.setItem(row, 4, priority_item)

            # 🔵 Highlight the suggested headset row
            if h["id"] == suggested_id:
                for col in range(5):
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

    def toggle_filter(self, state):
        """Toggle the filter for hiding 'account in use' headsets"""
        self.hide_account_in_use = state == Qt.CheckState.Checked.value
        self.refresh()

    def set_priority(self):
        """Open priority dialog for selected headset"""
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select a headset to set its priority.")
            return
        
        if len(selected) > 1:
            QMessageBox.warning(self, "Warning", "Please select only one headset to set its priority.")
            return
        
        # Find the actual headset data (accounting for filtering)
        row = selected[0].row()
        filtered_data = self.data
        if self.hide_account_in_use:
            used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
            filtered_data = [h for h in self.data if not (h["account_id"] in used_accounts and not h["in_use"])]
        
        if row >= len(filtered_data):
            return
        
        headset = filtered_data[row]
        
        # Open priority dialog
        dialog = PriorityDialog(headset, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            new_priority = dialog.get_priority()
            # Find the headset in the original data and update it
            for h in self.data:
                if h["id"] == headset["id"]:
                    h["custom_priority"] = new_priority
                    break
            self.refresh()

    def checkout_selected(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset.")
            return

        # Get filtered data to map table rows to actual headsets
        filtered_data = self.data
        if self.hide_account_in_use:
            used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
            filtered_data = [h for h in self.data if not (h["account_id"] in used_accounts and not h["in_use"])]

        used_accounts = {h["account_id"] for h in self.data if h["in_use"]}

        for idx in selected:
            row = idx.row()
            if row >= len(filtered_data):
                continue
            
            headset = filtered_data[row]
            # Find the headset in the original data
            for i, h in enumerate(self.data):
                if h["id"] == headset["id"]:
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
                    break

        self.refresh()

    def return_selected(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset.")
            return

        # Get filtered data to map table rows to actual headsets
        filtered_data = self.data
        if self.hide_account_in_use:
            used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
            filtered_data = [h for h in self.data if not (h["account_id"] in used_accounts and not h["in_use"])]

        for idx in selected:
            row = idx.row()
            if row >= len(filtered_data):
                continue
            
            headset = filtered_data[row]
            # Find the headset in the original data
            for i, h in enumerate(self.data):
                if h["id"] == headset["id"]:
                    if self.data[i]["in_use"]:
                        self.data[i]["in_use"] = False
                    break

        self.refresh()

    def toggle_headset(self, row, col):
        """Double click to quickly checkout/return"""
        # Get filtered data to map table rows to actual headsets
        filtered_data = self.data
        if self.hide_account_in_use:
            used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
            filtered_data = [h for h in self.data if not (h["account_id"] in used_accounts and not h["in_use"])]
        
        if row >= len(filtered_data):
            return
        
        headset = filtered_data[row]
        # Find the headset in the original data
        for i, h in enumerate(self.data):
            if h["id"] == headset["id"]:
                if self.data[i]["in_use"]:
                    self.data[i]["in_use"] = False
                else:
                    used_accounts = {h["account_id"] for h in self.data if h["in_use"]}
                    if self.data[i]["account_id"] in used_accounts:
                        QMessageBox.critical(
                            self, "Error", f"Account {self.data[i]['account_id']} already in use! Can't use {self.data[i]['id']}."
                        )
                        return
                    self.data[i]["in_use"] = True
                    self.data[i]["last_used"] = datetime.datetime.now().isoformat()
                break
        self.refresh()

# ---------------- RUN ----------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = HeadsetManager()
    window.show()
    sys.exit(app.exec())
