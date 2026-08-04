#!/bin/zsh

set -euo pipefail

input_dir="${1:-public/images/exercises}"
output_dir="${2:-GIF素材提交区/静态图最终版}"
mkdir -p "$output_dir"

for input_file in "$input_dir"/*.gif; do
  name="${input_file:t:r}"
  swift scripts/media_first_frame_to_png.swift "$input_file" "$output_dir/$name.png"
done
