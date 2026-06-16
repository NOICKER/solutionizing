import subprocess
import os

files_to_diff = [
    "app/globals.css",
    "app/layout.tsx",
    "app/page.tsx",
    "app/contact/page.tsx",
    "components/solutionizing/FounderDashboardPage.tsx",
    "components/solutionizing/LandingPageClientBlocks.tsx",
    "components/solutionizing/LandingPageHeader.tsx",
    "components/solutionizing/MissionDashboardMockup.tsx",
    "components/solutionizing/MissionStatusPage.tsx",
    "components/solutionizing/MissionWizardPage.tsx",
    "components/solutionizing/TesterDashboardPage.tsx",
    "components/solutionizing/founder/FounderDashboardTab.tsx",
    "components/solutionizing/founder/FounderMissionsTab.tsx",
    "components/solutionizing/founder/FounderSettingsTab.tsx",
    "components/solutionizing/founder/FounderWalletsTab.tsx",
    "components/solutionizing/legal/LegalPageLayout.tsx",
    "components/solutionizing/shared/SupportPage.tsx",
    "components/solutionizing/tester/TesterMissionsTab.tsx",
    "components/solutionizing/tester/TesterSettingsTab.tsx",
    "components/solutionizing/ui.tsx"
]

deleted_files = [
    "components/AppThemeBoundary.tsx",
    "components/solutionizing/shared/ThemeToggleButton.tsx",
    "context/ThemeContext.tsx"
]

untracked_files = [
    "components/ui/Cursor.tsx"
]

repo_path = "c:\\Users\\Shubhi Mishra\\Desktop\\solutionizing 5"
output_file = os.path.join(repo_path, "scratch", "ui_diff_raw.txt")

# Ensure scratch directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, "w", encoding="utf-8") as out:
    out.write("=== UNCOMMITTED UI CHANGES RAW DIFF ===\n\n")
    
    out.write("--- DELETED THEME FILES ---\n")
    for df in deleted_files:
        out.write(f"Deleted: {df}\n")
    out.write("\n")
    
    out.write("--- UNTRACKED NEW FILES ---\n")
    for uf in untracked_files:
        full_path = os.path.join(repo_path, uf)
        if os.path.exists(full_path):
            out.write(f"Created/New file: {uf}\n")
            with open(full_path, "r", encoding="utf-8") as f:
                out.write(f"--- CONTENT START: {uf} ---\n")
                out.write(f.read())
                out.write(f"\n--- CONTENT END: {uf} ---\n\n")
                
    out.write("--- MODIFIED FILES DIFFS ---\n")
    for f in files_to_diff:
        print(f"Diffing {f}...")
        try:
            result = subprocess.run(
                ["git", "diff", f],
                cwd=repo_path,
                capture_output=True,
                text=True,
                check=True,
                encoding="utf-8"
            )
            out.write(f"=== DIFF FOR {f} ===\n")
            if result.stdout.strip():
                out.write(result.stdout)
            else:
                out.write("(No changes or file doesn't exist in git repository)\n")
            out.write("\n\n")
        except Exception as e:
            out.write(f"=== ERROR DIFFING {f} ===\n{str(e)}\n\n")

print(f"Raw diff output written to {output_file}")
