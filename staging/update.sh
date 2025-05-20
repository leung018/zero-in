#!/bin/bash

# Use chrome to load unpacked extension that created by this script.
# After that, each time you run this script, it will download the latest version of the extension and update it.

URL="https://github.com/leung018/task-concentrator/releases/download/dev-latest/task-concentrator-dev-latest.zip"
ZIP_FILE="task-concentrator-dev-latest.zip"

echo "Downloading from $URL..."
curl -L -o "$ZIP_FILE" "$URL"

if unzip -t "$ZIP_FILE" > /dev/null 2>&1; then
    echo "Valid ZIP file. Updating..."
    rm -r task-concentrator
    unzip -q "$ZIP_FILE"
else
    echo "Error: The downloaded file is not a valid ZIP archive." >&2
    exit 1
fi