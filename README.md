# VATS - VARIA's Awesome Tracking Software

## Features

### Headset Management
- See which headsets are in use, available, or have account conflicts
- Get recommendations for the next best headset to checkout
- Prevents multiple headsets from using the same account

### Controls
- Set individual headset priorities
- Hide "Account in Use" headsets to focus on truly available units
- Double-click any headset to instantly checkout/return
- Select multiple headsets for batch checkout/return

### User Interface
- Green (Available), Red (In Use), Yellow (Account Blocked)
- See both custom and default priorities

## Quick Start

### Prerequisites
- Python 3.7+
- PyQt6

### Installation
```bash
# Clone the repository
git clone https://github.com/Unquieterpig/VATS.git
cd VATS

# Install dependencies
pip install -r requirements.txt

# Run the application
python VATS.py
```

## 📖 How to Use

### Basic Operations
1. Select headset(s) and click "Checkout Selected"
2. Select headset(s) and click "Return Selected"  
3. **Quick Toggle**: Double-click any headset to instantly toggle its status
4. Check the banner at the top for the recommended next headset

### Advanced Features
- Select a headset and click "Set Priority" to override the default model priority
- Check "Hide 'Account in Use' headsets" to clean up your view
- Use Ctrl+Click or Shift+Click to select multiple headsets

### Priority System
- **Lower numbers = Higher priority** (1 is highest priority)
- Custom priorities override model defaults

## Supported Headset Models
- **Meta Quest 3** (Priority: 1)
- **Meta Quest 2** (Priority: 2) 
- **HTC Vive XR** (Priority: 3)

*Custom priorities can be set for any headset to override these defaults.*

## Data Storage
- Headset data is stored in `headsets.json`
- All settings and custom priorities persist between sessions
- Automatic backup on every operation

## Technical Details
- **Framework**: PyQt6
- **Data Format**: JSON
- **Python Version**: 3.7+
- **Platform**: Cross-platform (Windows, macOS, Linux)

## Contributing
Feel free to submit issues, feature requests, or pull requests to improve VATS!

## License
This project is open source and available under the MIT License.
