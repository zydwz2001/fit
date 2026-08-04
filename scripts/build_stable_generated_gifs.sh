#!/bin/zsh

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  print -u2 "用法: scripts/build_stable_generated_gifs.sh <imagegen-精灵图目录> [输出目录]"
  exit 2
fi

sprite_root="$1"
output_dir="${2:-GIF素材提交区/稳定版}"
mkdir -p "$output_dir"

assets=(
  "pullup|exec-f09affeb-488f-46ba-8559-a924a3058d45.png"
  "dumbbell_shoulder_press|exec-1cbe2d00-e2a2-478d-aba2-e2c7504449a0.png"
  "incline_dumbbell_press|exec-cf4576bc-e777-44b9-8997-abcebdf13d14.png"
  "reverse_lat_pulldown|exec-2357aa84-64c8-485b-9f76-872e18079d64.png"
  "hill_climbing|exec-1d3c77aa-d018-4842-9c41-449f7274f6be.png"
  "stair_climber|exec-b77f3f2e-5118-44e9-b316-89695968378e.png"
  "crunch|exec-187478eb-03e0-485c-87d5-ae0723e3e170.png"
  "bent_over_dumbbell_reverse_fly|exec-89c301a2-762b-4541-b47c-5ac8ba67c200.png"
  "swimming|exec-0b6df2ab-87b6-4d6d-81e4-56c005cc80b9.png"
  "kickboxing|exec-bcb23dc2-fb4b-4acc-94e6-051bee7d0bc4.png"
  "hip_abduction|exec-61690aef-fa61-4d93-a3eb-706fa51cb9fa.png"
  "hip_adduction|exec-4413dbd4-f602-4981-9c69-3d1b70dfb6e5.png"
  "bulgarian_squat|exec-84ddd106-22e5-4704-b233-f82f4236c4df.png"
  "dumbbell_benchpress|exec-b56fa5e1-4830-4eb8-9c38-83e6e518d367.png"
  "single_leg_dumbbell_deadlift|exec-8297b4b7-0f10-4f87-bfe4-1a6bbd854c47.png"
  "australian_pullup|exec-4eab6571-8adc-48b3-918f-944cf1561510.png"
  "tbar_row|exec-3488014d-0a78-49f1-8aac-586ea44fed81.png"
)

for asset in "${assets[@]}"; do
  name="${asset%%|*}"
  source_file="${asset#*|}"
  swift scripts/sprite_sheet_to_gif.swift \
    "$sprite_root/$source_file" \
    "$output_dir/$name.gif"
done
