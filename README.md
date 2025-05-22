# PromptBear - Prompt Management Platform

[正體中文](./README.zh-TW.md) | English

## Introduction

PromptBear is a platform designed specifically for managing prompts, allowing users to efficiently create, edit, and organize various types of prompts. Through integration with a Chrome extension, users can quickly access and apply prompts anytime, anywhere, improving efficiency.

## Core Features

### Prompt Management

- **Structured Prompt Folders**: Organize large numbers of prompts through a folder system for easy searching and management.
- **Shortcut Support**: Set shortcuts for commonly used prompts to accelerate your workflow.
- **Prompt Templates**: Built-in reusable templates and custom fields for quickly applying common prompt structures.

### Interactive Editing

- **Parameterized Prompts**: Support for fill-in-the-blank functionality where users can define variables in prompts and quickly fill them via dropdown options or input fields, enhancing prompt customization efficiency.
- **Diverse Parameter Options**: Provide dropdowns, radio/checkbox buttons, and toggle switches to make prompts parameterized and more flexible for different scenarios.
- **Rich Text Editing**: Support for formatted text, lists, code blocks, and various formats for more flexible prompt editing.

### Visual Flow Editing

- **Flow Chart Editor**: Create nodes and connections using drag-and-drop, visualizing relationships and flows between prompts.
- **Multiple Node Types**:
  - Text Input Nodes: For creating basic text-based prompts.
  - AI Prompt Nodes: Contains default AI prompt templates for quick application.
  - File Upload Nodes: Support for reading text content from files as part of prompts.

### Other Applications

- **Chrome Extension Integration**: Supports integration with Chrome extensions, allowing quick access and application of your prompts on any website.

## Technology Stack

PromptBear primarily uses the following technologies:

- **Frontend Framework**: Next.js for building the application, combined with React to provide high-performance user interfaces.
- **Type Safety**: TypeScript enhances code maintainability and reliability.
- **UI Components**: Shadcn UI component library provides a modern and consistent user interface.
- **Authentication**: NextAuth.js implements secure user login and authentication.

## Getting Started

### Installation

1. Clone the project repository:

```bash
git clone https://github.com/yourusername/..
cd promptbear
```

2. Install the required dependencies:

```bash
npm install
```

3. Create a `.env.local` file and set necessary environment variables:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and visit http://localhost:3000 to start using PromptBear.

### Beginner's Guide

1. **Create an Account**: When using for the first time, click "Sign Up" to create your account.
2. **Create Folders**: Create new folders on the "Prompts" page to organize your prompts.
3. **Create Prompts**: Create new prompts in folders, using custom templates or starting from scratch.
5. **Parameterization**: Add variable fields in prompts to make them more flexible and reusable.

## Continuous Updates

The PromptBear team continuously develops new features and improvements, with future plans including:

- AI-assisted prompt optimization suggestions
  - Expanded third-party AI model integration
- Team collaboration features
- More customizable templates
- **Prompt Sharing**: Share effective prompts with team members via links or export functionality.
- Visual Flow Editing:
- **Flow Chart Editor**: Create nodes and connections using drag-and-drop, visualizing relationships and flows between prompts.
- **Multiple Node Types**:
  - Text Input Nodes: For creating basic text-based prompts.
  - AI Prompt Nodes: Contains default AI prompt templates for quick application.
  - File Upload Nodes: Support for reading text content from files as part of prompts.

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js:

1. Import your GitHub project on Vercel.
2. Set the required environment variables.
3. Deploy!


## License

MIT License
