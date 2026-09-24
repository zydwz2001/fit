import type { Exercise } from '@/types';

// Distinct equipment, grips and postures retain their own stable IDs.
export const XUNJI_ADDITIONAL_EXERCISES: Exercise[] = [
  {
    "id": "xunji_smith_squat",
    "name": "史密斯机深蹲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_dumbbell_bulgarian_squat",
    "name": "哑铃保加利亚蹲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_dumbbell_squat",
    "name": "哑铃深蹲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_dumbbell_sumo_squat",
    "name": "哑铃相扑蹲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_dumbbell_lunge",
    "name": "哑铃箭步蹲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_goblet_squat",
    "name": "哑铃酒杯深蹲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_leg_press",
    "name": "器械倒蹬",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_leg_extension",
    "name": "坐姿腿屈伸",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_seated_leg_curl",
    "name": "坐姿腿弯举",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_leg_curl",
    "name": "腿弯举",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_band_lying_leg_curl",
    "name": "弹力带-平躺腿弯举",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_band_leg_raise",
    "name": "弹力带-提腿",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_band_standing_leg_curl",
    "name": "弹力带-站姿腿弯举",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_band_standing_kick",
    "name": "弹力带-站姿踢腿",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_good_morning",
    "name": "早安",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_barbell_hip_thrust",
    "name": "杠铃臀冲",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_barbell_glute_bridge",
    "name": "杠铃臀桥",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_standing_dumbbell_calf_raise",
    "name": "站姿哑铃提踵",
    "muscleGroup": "腿",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_narrow_tbar_row",
    "name": "T杆划船（窄）",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_vbar_pulldown",
    "name": "V-bar下拉",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_vbar_row",
    "name": "V-bar划船",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_prone_tbar_row",
    "name": "俯卧T-bar划船",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_prone_dumbbell_row",
    "name": "俯卧哑铃划船",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_prone_hammer_dumbbell_row",
    "name": "俯卧哑铃划船（锤式）",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_reverse_barbell_row",
    "name": "反手杠铃划船",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_smith_assisted_pullup",
    "name": "史密斯辅助引体",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_supported_dumbbell_row",
    "name": "哑铃划船（手扶）",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_machine_pulldown_v2",
    "name": "器械下拉（版本2）",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_seated_row",
    "name": "坐姿划船",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_wide_reverse_pulldown",
    "name": "宽握反手下拉",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_wide_pulldown",
    "name": "宽距下拉",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_back_extension",
    "name": "山羊挺身",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "additional-weight"
  },
  {
    "id": "xunji_lying_dumbbell_pullover",
    "name": "平躺哑铃过头拉",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_assisted_pullup",
    "name": "引体向上（辅助）",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "volumeMode": "assisted-bodyweight"
  },
  {
    "id": "xunji_hammer_row_v1",
    "name": "悍马机划船(v1)",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_hammer_high_row",
    "name": "悍马机大剪刀",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_horizontal_back_extension",
    "name": "水平山羊挺身",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "additional-weight"
  },
  {
    "id": "xunji_narrow_pulldown",
    "name": "窄距下拉",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_standing_dumbbell_row",
    "name": "站姿哑铃划船",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_straight_arm_pulldown",
    "name": "绳索直臂下压",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_behind_neck_pulldown",
    "name": "颈后下拉",
    "muscleGroup": "背",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_incline_pushup",
    "name": "上斜俯卧撑",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_incline_smith_press",
    "name": "上斜史密斯机卧推",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_incline_dumbbell_fly",
    "name": "上斜哑铃飞鸟",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_incline_barbell_press",
    "name": "上斜杠铃卧推",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_weighted_dip",
    "name": "双杠臂屈伸（负重）",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "additional-weight"
  },
  {
    "id": "xunji_smith_press",
    "name": "史密斯机卧推",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_dumbbell_fly",
    "name": "哑铃飞鸟",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": true,
    "sets": [],
    "aliases": [
      "平躺哑铃飞鸟"
    ]
  },
  {
    "id": "xunji_machine_chest_press",
    "name": "器械推胸",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_hammer_floor_press",
    "name": "地板哑铃卧推（锤式）",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_plate_squeeze_press",
    "name": "杠铃片夹胸",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_narrow_dumbbell_press",
    "name": "窄距哑铃卧推",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_cable_fly",
    "name": "绳索夹胸",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_kneeling_pushup",
    "name": "跪姿俯卧撑",
    "muscleGroup": "胸",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_front_raise",
    "name": "前平举",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_half_bent_lateral_raise",
    "name": "半俯身侧平举",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_dumbbell_upright_row",
    "name": "哑铃直立划船",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_machine_lateral_raise",
    "name": "器械侧平举",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_machine_shoulder_press",
    "name": "器械坐姿推举",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_single_cable_lateral_raise",
    "name": "绳索侧平举（单边）",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_reverse_pec_deck",
    "name": "蝴蝶机反向飞鸟",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_arnold_press",
    "name": "阿诺德推肩",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_face_pull",
    "name": "面拉",
    "muscleGroup": "肩",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_ez_bar_curl",
    "name": "EZ杆二头弯举",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_single_dumbbell_overhead_extension",
    "name": "哑铃过头臂屈伸（单手）",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_machine_triceps_pushdown",
    "name": "器械三头下压（正向）",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_floor_dumbbell_skullcrusher",
    "name": "地板哑铃碎颅者",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_single_preacher_curl",
    "name": "坐姿单手牧师凳弯举",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_bench_dip",
    "name": "平板臂屈伸",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_bent_knee_bench_dip",
    "name": "平板臂屈伸（屈腿）",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "reps-only"
  },
  {
    "id": "xunji_preacher_curl",
    "name": "牧师凳弯举",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_hammer_preacher_curl",
    "name": "牧师凳锤式弯举",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_straight_bar_pushdown",
    "name": "直杆绳索下压",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_skullcrusher",
    "name": "碎颅者",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": true,
    "sets": []
  },
  {
    "id": "xunji_cable_triceps_extension",
    "name": "绳索臂屈伸",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_concentration_curl",
    "name": "集中弯举",
    "muscleGroup": "臂",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_machine_crunch",
    "name": "器械卷腹",
    "muscleGroup": "核心",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_leg_raise",
    "name": "抬腿",
    "muscleGroup": "核心",
    "category": "strength",
    "useLeftRight": false,
    "sets": [],
    "recordingMode": "additional-weight"
  },
  {
    "id": "xunji_cable_crunch",
    "name": "绳索卷腹",
    "muscleGroup": "核心",
    "category": "strength",
    "useLeftRight": false,
    "sets": []
  },
  {
    "id": "xunji_upper_body_release",
    "name": "上半身松解",
    "muscleGroup": "拉伸放松",
    "category": "cardio",
    "useLeftRight": false,
    "sets": []
  }
];
