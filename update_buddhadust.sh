#!/bin/bash
# Script to update Buddhadust glossology from remote source
# Run from repo root: ./update_buddhadust.sh

REMOTE_URL="https://buddhadust.net/backmatter/glossology/glossologytoc.htm"
LOCAL_PATH="exporter/dpd/static/buddhadust-glossology.htm"

echo "Updating Buddhadust glossology..."
echo "Downloading from: $REMOTE_URL"
echo "Saving to: $LOCAL_PATH"

# Create directory if it doesn't exist
mkdir -p "$(dirname "$LOCAL_PATH")"

# Download the file
if curl -s -f "$REMOTE_URL" -o "$LOCAL_PATH"; then
    echo "Successfully updated Buddhadust glossology!"
    echo "File size: $(stat -c%s "$LOCAL_PATH") bytes"
else
    echo "Error: Failed to download from $REMOTE_URL"
    exit 1
fi