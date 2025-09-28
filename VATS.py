import datetime
import json
import os
import sys

from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor
from PyQt6.QtWidgets import (
    QApplication,
    QCheckBox,
    QDialog,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from dialogs import (
    AddHeadsetDialog,
    EditHeadsetDialog,
    Headset,
    PriorityDialog,
)

# ---------------- GLOBAL CONFIG ----------------
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


# ---------------- DATA HELPERS ----------------
def load_data():
    if not os.path.exists(DATA_FILE):
        sample_data = [
            {
                "id": "Quest3-001",
                "model": "Quest3",
                "account_id": "demo_account_1",
                "last_used": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "in_use": False,
            },
            {
                "id": "Quest2-001",
                "model": "Quest2",
                "account_id": "demo_account_2",
                "last_used": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "in_use": False,
            },
            {
                "id": "HTC-001",
                "model": "HTC_Vive_XR",
                "account_id": "demo_account_3",
                "last_used": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "in_use": False,
            },
        ]

        save_data(sample_data)
        return sample_data
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_used_accounts(headsets):
    return {h["account_id"] for h in headsets if h["in_use"]}


def filter_headsets(headsets, hide_account_in_use=False):
    if not hide_account_in_use:
        return headsets

    used_accounts = get_used_accounts(headsets)
    return [
        h
        for h in headsets
        if not (h["account_id"] in used_accounts and not h["in_use"])
    ]


# Not used for now
# todo: make search by id work for long lists
# def find_headset_by_id(headsets, headset_id):
#     for i, h in enumerate(headsets):
#         if h["id"] == headset_id:
#             return i, h
#     return None, None


# ---------------- LOGIC ----------------
def suggest_headset(headsets):
    used_accounts = get_used_accounts(headsets)

    available = [
        h for h in headsets if not h["in_use"] and h["account_id"] not in used_accounts
    ]

    if not available:
        return None

    def get_priority(headset):
        if "custom_priority" in headset:
            return headset["custom_priority"]
        return DEFAULT_PRIORITY.get(headset["model"], 999)

    available.sort(key=lambda h: (get_priority(h), h["last_used"]))
    return available[0]


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
        self.suggest_label.setStyleSheet(DEFAULT_STYLE)
        layout.addWidget(self.suggest_label)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(TABLE_COLUMN_COUNT)
        self.table.setHorizontalHeaderLabels(TABLE_COLUMNS)
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
        add_btn = QPushButton("Add Headset")
        edit_btn = QPushButton("Edit Headset")
        remove_btn = QPushButton("Remove Headset")
        refresh_btn = QPushButton("Refresh")
        checkout_btn.clicked.connect(self.checkout_selected)
        return_btn.clicked.connect(self.return_selected)
        priority_btn.clicked.connect(self.set_priority)
        add_btn.clicked.connect(self.add_headset)
        edit_btn.clicked.connect(self.edit_headset)
        remove_btn.clicked.connect(self.remove_headset)
        refresh_btn.clicked.connect(self.refresh)
        button_layout.addWidget(checkout_btn)
        button_layout.addWidget(return_btn)
        button_layout.addWidget(priority_btn)
        button_layout.addWidget(add_btn)
        button_layout.addWidget(edit_btn)
        button_layout.addWidget(remove_btn)
        button_layout.addWidget(refresh_btn)
        layout.addLayout(button_layout)

        # Central Widget
        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.refresh()

    # -------- Helper Methods --------
    def create_table_item(
        self, text, alignment=Qt.AlignmentFlag.AlignLeft, background=None
    ):
        item = QTableWidgetItem(text)
        item.setTextAlignment(alignment)
        if background:
            item.setBackground(background)
        return item

    def update_suggestion_banner(self, suggestion):
        if suggestion:
            self.suggest_label.setText(
                f"Suggested Next Headset: {suggestion['id']} ({suggestion['model']})"
            )
            self.suggest_label.setStyleSheet(SUGGESTED_STYLE)
        else:
            self.suggest_label.setText("No Headsets Available")
            self.suggest_label.setStyleSheet(NO_AVAILABLE_STYLE)

    def populate_table_row(self, row, headset_data, used_accounts, suggested_id):
        headset = Headset(headset_data)

        id_item = self.create_table_item(headset.id)
        model_item = self.create_table_item(headset.model)
        account_item = self.create_table_item(headset.account_id)

        status_text, status_color = headset.get_status_info(used_accounts)
        status_item = self.create_table_item(
            status_text, Qt.AlignmentFlag.AlignCenter, status_color
        )

        priority_item = self.create_table_item(
            headset.get_priority_display(), Qt.AlignmentFlag.AlignCenter
        )

        self.table.setItem(row, 0, id_item)
        self.table.setItem(row, 1, model_item)
        self.table.setItem(row, 2, account_item)
        self.table.setItem(row, 3, status_item)
        self.table.setItem(row, 4, priority_item)

        if headset.id == suggested_id:
            for col in range(TABLE_COLUMN_COUNT):
                self.table.item(row, col).setBackground(COLOR_SUGGESTED)

    def validate_headset_operation(self, headset_data, used_accounts):
        if headset_data["in_use"]:
            return False, "Headset is already in use"
        if headset_data["account_id"] in used_accounts:
            return (
                False,
                f"Account {headset_data['account_id']} already in use! Can't use {headset_data['id']}.",
            )
        return True, None

    def checkout_headset(self, headset_data):
        headset_data["in_use"] = True
        headset_data["last_used"] = datetime.datetime.now(
            datetime.timezone.utc
        ).isoformat()

    # -------- Core Logic --------
    def refresh(self):
        filtered_data = filter_headsets(self.data, self.hide_account_in_use)
        used_accounts = get_used_accounts(self.data)
        suggestion = suggest_headset(self.data)
        suggested_id = suggestion["id"] if suggestion else None

        self.table.setRowCount(len(filtered_data))
        for row, headset_data in enumerate(filtered_data):
            self.populate_table_row(row, headset_data, used_accounts, suggested_id)

        self.update_suggestion_banner(suggestion)

        save_data(self.data)

    def toggle_filter(self, state):
        self.hide_account_in_use = state == Qt.CheckState.Checked.value
        self.refresh()

    def set_priority(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(
                self, "Warning", "Select a headset to set its priority."
            )
            return

        if len(selected) > 1:
            QMessageBox.warning(
                self, "Warning", "Please select only one headset to set its priority."
            )
            return

        row = selected[0].row()
        filtered_data = filter_headsets(self.data, self.hide_account_in_use)

        if row >= len(filtered_data):
            return

        headset_data = filtered_data[row]

        # Open priority dialog
        dialog = PriorityDialog(headset_data, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            new_priority = dialog.get_priority()
            headset_data["custom_priority"] = new_priority
            self.refresh()

    def checkout_selected(self):
        """Checkout all selected headsets"""
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset.")
            return

        filtered_data = filter_headsets(self.data, self.hide_account_in_use)
        used_accounts = get_used_accounts(self.data)

        for idx in selected:
            row = idx.row()
            if row >= len(filtered_data):
                continue

            headset_data = filtered_data[row]

            is_valid, error_msg = self.validate_headset_operation(
                headset_data, used_accounts
            )
            if not is_valid:
                QMessageBox.critical(self, "Error", error_msg)
                continue

            self.checkout_headset(headset_data)
            used_accounts.add(headset_data["account_id"])

        self.refresh()

    def return_selected(self):
        """Return all selected headsets"""
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset.")
            return

        filtered_data = filter_headsets(self.data, self.hide_account_in_use)

        for idx in selected:
            row = idx.row()
            if row >= len(filtered_data):
                continue

            headset_data = filtered_data[row]
            if headset_data["in_use"]:
                headset_data["in_use"] = False

        self.refresh()

    def toggle_headset(self, row, col):
        filtered_data = filter_headsets(self.data, self.hide_account_in_use)

        if row >= len(filtered_data):
            return

        headset_data = filtered_data[row]
        used_accounts = get_used_accounts(self.data)

        if headset_data["in_use"]:
            headset_data["in_use"] = False
        else:
            is_valid, error_msg = self.validate_headset_operation(
                headset_data, used_accounts
            )
            if not is_valid:
                QMessageBox.critical(self, "Error", error_msg)
                return
            self.checkout_headset(headset_data)

        self.refresh()

    def add_headset(self):
        dialog = AddHeadsetDialog(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:

            is_valid, error_msg = dialog.validate_input()
            if not is_valid:
                QMessageBox.warning(self, "Invalid Input", error_msg)
                return
            
            new_headset = dialog.get_headset_data()
            
            existing_ids = {h["id"] for h in self.data}
            if new_headset["id"] in existing_ids:
                QMessageBox.warning(
                    self, 
                    "Duplicate ID", 
                    f"Headset ID '{new_headset['id']}' already exists. Please choose a different ID."
                )
                return
            
            self.data.append(new_headset)
            self.refresh()
            
            QMessageBox.information(
                self, 
                "Success", 
                f"Headset '{new_headset['id']}' has been added successfully."
            )

    def remove_headset(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select at least one headset to remove.")
            return

        filtered_data = filter_headsets(self.data, self.hide_account_in_use)
        headsets_to_remove = []
        
        for idx in selected:
            row = idx.row()
            if row < len(filtered_data):
                headsets_to_remove.append(filtered_data[row])

        if not headsets_to_remove:
            return

        in_use_headsets = [h for h in headsets_to_remove if h["in_use"]]
        if in_use_headsets:
            in_use_ids = [h["id"] for h in in_use_headsets]
            QMessageBox.warning(
                self, 
                "Cannot Remove", 
                f"Cannot remove headsets that are currently in use: {', '.join(in_use_ids)}"
            )
            return

        headset_ids = [h["id"] for h in headsets_to_remove]
        reply = QMessageBox.question(
            self,
            "Confirm Removal",
            f"Are you sure you want to remove the following headset(s)?\n\n{', '.join(headset_ids)}\n\nThis action cannot be undone.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            ids_to_remove = {h["id"] for h in headsets_to_remove}
            self.data = [h for h in self.data if h["id"] not in ids_to_remove]
            self.refresh()
            
            QMessageBox.information(
                self, 
                "Success", 
                f"Removed {len(headsets_to_remove)} headset(s) successfully."
            )

    def edit_headset(self):
        selected = self.table.selectionModel().selectedRows()
        if not selected:
            QMessageBox.warning(self, "Warning", "Select a headset to edit.")
            return

        if len(selected) > 1:
            QMessageBox.warning(
                self, "Warning", "Please select only one headset to edit."
            )
            return

        filtered_data = filter_headsets(self.data, self.hide_account_in_use)
        row = selected[0].row()
        
        if row >= len(filtered_data):
            return

        headset_data = filtered_data[row]
        
        if headset_data["in_use"]:
            QMessageBox.warning(
                self, 
                "Cannot Edit", 
                f"Cannot edit headset '{headset_data['id']}' while it's in use. Please return it first."
            )
            return

        dialog = EditHeadsetDialog(headset_data, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            existing_ids = {h["id"] for h in self.data}
            is_valid, error_msg = dialog.validate_input(existing_ids)
            
            if not is_valid:
                QMessageBox.warning(self, "Invalid Input", error_msg)
                return
            
            updated_headset = dialog.get_headset_data()
            
            updated_headset["in_use"] = headset_data["in_use"]
            updated_headset["last_used"] = headset_data["last_used"]
            
            for i, h in enumerate(self.data):
                if h["id"] == headset_data["id"]:
                    self.data[i] = updated_headset
                    break
            
            self.refresh()
            
            QMessageBox.information(
                self, 
                "Success", 
                f"Headset '{updated_headset['id']}' has been updated successfully."
            )


# ---------------- RUN ----------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = HeadsetManager()
    window.show()
    sys.exit(app.exec())
