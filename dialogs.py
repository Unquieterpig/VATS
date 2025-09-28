import datetime

from PyQt6.QtWidgets import (
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QLabel,
    QLineEdit,
    QSpinBox,
)

from config import (
    COLOR_ACCOUNT_BLOCKED,
    COLOR_AVAILABLE,
    COLOR_IN_USE,
    DEFAULT_PRIORITY,
    STATUS_ACCOUNT_IN_USE,
    STATUS_AVAILABLE,
    STATUS_IN_USE,
)


# ---------------- HEADSET MODEL ----------------
class Headset:
    """Model class"""

    def __init__(self, data):
        self.data = data

    @property
    def id(self):
        return self.data["id"]

    @property
    def model(self):
        return self.data["model"]

    @property
    def account_id(self):
        return self.data["account_id"]

    @property
    def in_use(self):
        return self.data["in_use"]

    @in_use.setter
    def in_use(self, value):
        self.data["in_use"] = value

    @property
    def last_used(self):
        return self.data["last_used"]

    @last_used.setter
    def last_used(self, value):
        self.data["last_used"] = value

    @property
    def custom_priority(self):
        return self.data.get("custom_priority")

    @custom_priority.setter
    def custom_priority(self, value):
        self.data["custom_priority"] = value

    def get_priority(self):
        if self.custom_priority is not None:
            return self.custom_priority
        return DEFAULT_PRIORITY.get(self.model, 999)

    def get_priority_display(self):
        if self.custom_priority is not None:
            return f"{self.custom_priority} (Custom)"
        return f"{DEFAULT_PRIORITY.get(self.model, 999)} (Default)"

    def get_status_info(self, used_accounts):
        if self.in_use:
            return STATUS_IN_USE, COLOR_IN_USE
        elif self.account_id in used_accounts:
            return STATUS_ACCOUNT_IN_USE, COLOR_ACCOUNT_BLOCKED
        else:
            return STATUS_AVAILABLE, COLOR_AVAILABLE


# ---------------- PRIORITY DIALOG ----------------
class PriorityDialog(QDialog):
    def __init__(self, headset_data, parent=None):
        super().__init__(parent)
        self.headset = Headset(headset_data)
        self.setWindowTitle(f"Set Priority for {self.headset.id}")
        self.setModal(True)
        self.resize(300, 150)

        layout = QFormLayout()

        # Current info
        info_label = QLabel(f"Model: {self.headset.model}")
        layout.addRow("Model:", info_label)

        # Priority input
        self.priority_spin = QSpinBox()
        self.priority_spin.setRange(1, 100)
        self.priority_spin.setValue(self.headset.get_priority())
        self.priority_spin.setToolTip(
            "Lower numbers = higher priority (1 = highest priority)"
        )
        layout.addRow("Priority:", self.priority_spin)

        # Buttons
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addRow(buttons)

        self.setLayout(layout)

    def get_priority(self):
        return self.priority_spin.value()


# ---------------- ADD HEADSET DIALOG ----------------
class AddHeadsetDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add New Headset")
        self.setModal(True)
        self.resize(400, 200)

        layout = QFormLayout()

        # ID input
        self.id_input = QLineEdit()
        self.id_input.setPlaceholderText("e.g., QuestyMcQuestface")
        layout.addRow("Headset ID:", self.id_input)

        # Model selection
        self.model_combo = QComboBox()
        self.model_combo.addItems(["Quest3", "Quest2", "HTC_Vive_XR"])
        layout.addRow("Model:", self.model_combo)

        # Account ID input
        self.account_input = QLineEdit()
        self.account_input.setPlaceholderText("e.g., account_1")
        layout.addRow("Account ID:", self.account_input)

        # Buttons
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addRow(buttons)

        self.setLayout(layout)

    def get_headset_data(self):
        return {
            "id": self.id_input.text().strip(),
            "model": self.model_combo.currentText(),
            "account_id": self.account_input.text().strip(),
            "last_used": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "in_use": False,
        }

    def validate_input(self):
        id_text = self.id_input.text().strip()
        account_text = self.account_input.text().strip()

        if not id_text:
            return False, "Headset ID cannot be empty"
        if not account_text:
            return False, "Account ID cannot be empty"

        return True, None


# ---------------- EDIT HEADSET DIALOG ----------------
class EditHeadsetDialog(QDialog):
    def __init__(self, headset_data, parent=None):
        super().__init__(parent)
        self.original_id = headset_data["id"]
        self.setWindowTitle(f"Edit Headset: {self.original_id}")
        self.setModal(True)
        self.resize(400, 200)

        layout = QFormLayout()

        # ID input
        self.id_input = QLineEdit()
        self.id_input.setText(headset_data["id"])
        self.id_input.setPlaceholderText("e.g., QuestyMcQuestface")
        layout.addRow("Headset ID:", self.id_input)

        # Model selection
        self.model_combo = QComboBox()
        self.model_combo.addItems(["Quest3", "Quest2", "HTC_Vive_XR"])
        self.model_combo.setCurrentText(headset_data["model"])
        layout.addRow("Model:", self.model_combo)

        # Account ID input
        self.account_input = QLineEdit()
        self.account_input.setText(headset_data["account_id"])
        self.account_input.setPlaceholderText("e.g., account_1")
        layout.addRow("Account ID:", self.account_input)

        # Buttons
        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addRow(buttons)

        self.setLayout(layout)

    def get_headset_data(self):
        return {
            "id": self.id_input.text().strip(),
            "model": self.model_combo.currentText(),
            "account_id": self.account_input.text().strip(),
            "last_used": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "in_use": False,
        }

    def validate_input(self, existing_ids):
        id_text = self.id_input.text().strip()
        account_text = self.account_input.text().strip()

        if not id_text:
            return False, "Headset ID cannot be empty"
        if not account_text:
            return False, "Account ID cannot be empty"

        if id_text != self.original_id and id_text in existing_ids:
            return (
                False,
                f"Headset ID '{id_text}' already exists. Please choose a different ID.",
            )

        return True, None
