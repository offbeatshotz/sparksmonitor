# Spark Monitor Web - GitHub Hosting Guide

This guide will help you host your Spark Monitor application on **GitHub Pages** for free, making it accessible from any browser via a public URL.

## Step 1: Create a GitHub Repository
1. Log in to your [GitHub account](https://github.com/).
2. Click the **+** icon in the top right and select **New repository**.
3. Name it (e.g., `spark-monitor`).
4. Set it to **Public**.
5. Do **not** initialize with a README (you already have files).
6. Click **Create repository**.

## Step 2: Upload your code
You can do this via the terminal in your IDE:

1. **Initialize Git**:
   ```bash
   git init
   ```
2. **Add Files**:
   ```bash
   git add index.html
   ```
3. **Commit**:
   ```bash
   git commit -m "Initial commit"
   ```
4. **Link to GitHub**:
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual info:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```
5. **Push**:
   ```bash
   git push -u origin main
   ```

## Step 3: Enable GitHub Pages
1. On your GitHub repository page, go to **Settings** (top tab).
2. Click **Pages** in the left sidebar.
3. Under **Build and deployment > Branch**, ensure it is set to `main` and the folder is `/ (root)`.
4. Click **Save**.

## Step 4: Access your Site
After a minute or two, GitHub will provide a link at the top of the Pages settings page. It will look like:
`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

### **Important Technical Requirements**
- **HTTPS is Mandatory**: The "Start Monitoring" feature (Screen Capture) will **only** work on secure connections (HTTPS). GitHub Pages provides this automatically.
- **Tesseract.js**: The application loads the OCR library from a CDN, so it will work perfectly on GitHub without any extra configuration.
