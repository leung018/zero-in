#!/bin/bash

# Use chrome to load unpacked extension that created by this script.
# After that, each time you run this script, it will download the latest version of the extension and update it.

# Change to the script directory
cd "$( dirname "${BASH_SOURCE[0]}" )"

ZIPPED_DIR="zero-in" 
ZIP_FILE="zero-in-dev-latest.zip"
URL="https://github.com/leung018/zero-in/releases/download/dev-latest/$ZIP_FILE" 

echo "Downloading from $URL..."
curl -L -o "$ZIP_FILE" "$URL"

if unzip -t "$ZIP_FILE" > /dev/null 2>&1; then
    echo "Valid ZIP file. Updating..."
    rm -r $ZIPPED_DIR
    unzip -q "$ZIP_FILE"
    echo "Update complete. Unpacked to $ZIPPED_DIR directory."
else
    echo "Error: The downloaded file is not a valid ZIP archive." >&2
    exit 1
fi