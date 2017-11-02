#!/usr/bin/env bash
set -e

# git clone https://github.com/mingkaic/shared_mongodb_api.git database
# git clone https://github.com/mingkaic/shared_grpc.git grpc
git submodule update --recursive --remote # grab subprojects
apt-get update && apt-get install -y ffmpeg

npm install;
