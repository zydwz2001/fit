# Vibe Fitness Pro

一个面向个人训练复盘的移动端健身记录工具，整合训练录入、身体数据追踪、照片对比和健身知识管理。

## Product Background

我做这个项目的起点来自几个真实使用痛点：

- Keep 的身体记录入口越来越深，非付费用户记录体重、围度和照片变化的路径变长。
- 训记适合专业训练记录，但记录链路偏繁琐，训练中连续输入重量、次数和左右侧数据不够顺手。
- Obsidian 适合知识沉淀，但不适合管理身体照片、训练截图和动作参考图。

Vibe Fitness Pro 的目标是把这些高频能力合成一个个人健身工作台：训练当天快速记录，训练后按月复盘，身体变化和知识笔记长期沉淀。

## Features

- 今日训练：动作库选择、组数录入、左右重量模式、完成组容量计算。
- 月视图回顾：按日期查看训练部位、训练容量和有氧记录。
- 身体追踪：体重、BMI、腰围、臂围等指标趋势；体重录入自动计算 BMI。
- 照片对比：上传身体照片，选择 2-4 张生成带日期标注的对比图。
- 知识管理：文件夹、Markdown 笔记、双链样式引用、数据导入导出。
- 私密保护：身体数据页带 demo 密码入口。

Demo passcode: `0000`

## Tech Architecture

```text
src/
  components/        reusable UI and chart/photo/editor components
  components/training/
                     training card, set row and custom keyboard
  contexts/          global app state and reducer
  pages/             Training, Body and Knowledge feature pages
  types/             domain models and default exercise library
  utils/             date, volume, BMI and localStorage helpers
```

The app is a local-first React application:

- Framework: Vite + React + TypeScript
- Styling: Tailwind CSS
- State: React Context + reducer
- Storage: browser `localStorage`
- Charts and photo comparison: SVG and Canvas

## Run Locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Notes

This is an MVP prototype. Data is stored locally in the browser and is not synced to a backend. The current version focuses on the core product loop: record training, track body changes, review history, and manage personal fitness knowledge.
