# Solutionizing Platform Page Audit

This document contains a comprehensive audit of every page, view, and primary user interface state across the Solutionizing codebase.

## Public Landing Page (/)

**Purpose**: Introduce Solutionizing, explain the matching methodology, list pricing plans, and serve as the main customer acquisition portal for founders and testers.

**Current layout**: A long, single-column, scrollable marketing layout composed of twelve distinct sections. The header occupies the top. The hero section divides copy and a dashboard preview mockup in a balanced 50-50 grid. The stats section spans two prominent cards across the screen. The product pillars, noise analysis, example signals, and three-step workflow sections each display in neat three-column grids. A full-width call-to-action banner for testers, a focused 600px max-width peer-review commentary container, a three-column pricing options grid, a final centered call-to-action prompt, and a multi-row footer complete the page.

**Key components**: Global navigation bar `LandingPageHeader` with brand logo emblem, desktop navigation anchors, mobile menu drawer toggle, primary call-to-action buttons `HeroActionButtons` and `BottomActionButtons`, interactive dashboard mockup preview `MissionDashboardMockup` with active data tabs, two stats tiles, three pillar card components, three methodology cards, three recent signal proof blocks containing green recommended next move sub-cards, tester signup banner trigger `TesterHeroAction`, three pricing layout blocks `PricingAction` with custom borders, bullet check lists, and policy terms footer triggers.

**Data handled**: Public startup stats, turnaround timing averages, average review checklist numbers, starter mission prices, growth bundle pricing, tester compensation rewards, recent product decision examples (e.g. CTA positioning, hero copy, feature adoption outcomes).

**Current visual style**: Deep dark premium theme with a dark grey background color. Elevated panels use custom card backgrounds. Typography is rendered via the Manrope variable font with bold weights. Accents utilize vibrant orange-coral hues for founder elements and blue hues for tester details. Borders use subtle dark styling with spacious margins and responsive grid containers. Micro-animations occur on hover transitions.

**Navigation connections**: Incoming from initial site visits. Outgoing links to authentication forms at `/auth` (with optional mode, role, and next parameters), static policy pages at `/terms`, `/privacy`, `/refund`, `/tester-payment-policy`, the `/contact` form, and active dashboard sessions at `/dashboard/founder` or `/dashboard/tester` for logged-in users.

## Public Tester Landing Page (/tester)

**Purpose**: Persuade prospective user-testers to sign up by explaining how matching works and outlining their earning potential.

**Current layout**: Scrollable marketing landing page. Displays a custom branding navigation bar at the top, a centered vertical column for copy details, a centered circular psychology icon mockup diagram, a four-column step indicators block, a large bottom registration call-to-action card, and a copyright footer.

**Key components**: Brand nav `TesterBrand`, Help Center links, Sign In button, uppercase pill badge, matched workflow diagram with psychology graphic, verification tags, four matched step cards with unique glyphs, bottom call-to-action panel `AuthActionLink`, and standard footer copyright text.

**Data handled**: Platform match process steps, data protection assurances, signup navigation directions.

**Current visual style**: Warm light theme featuring a cream background color. Surfaces use white panel containers. Terracotta represents the primary call-to-action color, sage green serves as the header text shade, and beige outline strokes provide spacing borders. Buttons scale and shift vertically on hover.

**Navigation connections**: Incoming from main landing footer links. Outgoing to `/contact` and `/auth` (signup with role parameters).

## Unified Authentication Page (/auth)

**Purpose**: Allow founders, testers, and admins to sign in, create a new account, or request a password reset email.

**Current layout**: Centered card layout. Placed in the middle of a full-screen viewport with a subtle top-radial color gradient. Proportions represent a 450px centered authentication container.

**Key components**: Top-centered brand logo mark, mode headings, input text fields (email address, password with toggle visibility eyeball button), check boxes (Remember me), submit button, error messages (email check, password complexity instructions, account status warnings), Google OAuth social sign in button, fallback navigation state anchors, verification success notification panel, and forgot password completion info card.

**Data handled**: User email addresses, authentication passwords, signup credentials, checkbox remember state, URL search parameters (mode, role, next paths), and Supabase session variables.

**Current visual style**: Dark slate background with a card wrapper. Inputs feature dark background fields with thin borders. Primary buttons use a solid gradient layout. Error alerts use yellow warning panels with high-contrast text or red inline errors.

**Navigation connections**: Incoming from landing call-to-actions, sidebar signout triggers, or middleware redirects. Outgoing on authentication success to `/select-role` (for new signups), `/onboarding` (if profile incomplete), `/dashboard/founder`, `/dashboard/tester`, `/dashboard/admin`, or the query-specified redirect path.

## Auth Reset Password Page (/auth/reset-password)

**Purpose**: Let authorized recovery session users enter a new password for their account.

**Current layout**: Centered 450px card layout on page.

**Key components**: Logo container, new password input, password confirmation input, password complexity guidelines, submit action button, recovery link validity validation errors, success check banner, and return link buttons.

**Data handled**: New password credentials, confirm password entries, recovery session tokens, URL hashes, mount verification status.

**Current visual style**: Ivory styling background with grey inputs. Buttons feature large capital labels. Ticks and alerts utilize high-contrast colors.

**Navigation connections**: Incoming from Supabase recovery redirects. Outgoing to `/auth/login` on success.

## Select Role Page (/select-role)

**Purpose**: Prompt new authenticated users to declare whether they are a founder or a tester.

**Current layout**: Centered two-card options layout. Proportions split the page into two equal-width columns for founder and tester roles.

**Key components**: Brand banner, option cards (founder selection, tester selection), first name input field inside each card, error text labels, submit buttons `CONTINUE AS FOUNDER` and `CONTINUE AS TESTER`, loading icons.

**Data handled**: Display names, user role updates.

**Current visual style**: Balanced light-to-dark backdrop, high-contrast borders, shadow drop offsets.

**Navigation connections**: Source: post-signup route. Target: `/onboarding`.

## Onboarding Page Onboarding Shell (/onboarding)

**Purpose**: Coordinate founder profile creation or tester setup steps in a single shell.

**Current layout**: Centered onboarding panel card. Progress bar at top, followed by interactive step forms and navigation buttons.

**Key components**:
- Onboarding Shell: Brand badge, active step count indicator, linear glowing progress bar, back/next action buttons, and loader animations.
- Founder Onboarding: Goal prompt, structural steps cards, profile details form (display name, company name), placeholder coins package panels with coming-soon badges, and completion verification panel.
- Tester Onboarding: Informational checklist, skills multi-select tag grid, device profile select buttons (Monitor, Smartphone, Tablet), encrypted bank details inputs (Account holder, account number, IFSC code), and success check banner.

**Data handled**: Step sequences, founder metadata, tester skill categories, device selections, encrypted payout details.

**Current visual style**: radial header gradient, rounded panel containers, glowing orange bar, animated transition indicators.

**Navigation connections**: Source: role select. Target: `/dashboard`.

## Founder Dashboard Page (/dashboard/founder)

**Purpose**: Allow founders to manage active missions, buy testing coins, modify preferences, and submit help tickets.

**Current layout**: Sidebar navigation (280px, left), main dashboard workspace (fluid right, fluid proportions). Tab-swappable panel. Mobile sticky bottom navigation bar at bottom.

**Key components**:
- Sidebar: Precision Core logo header, navigation buttons (dashboard, missions, wallets, settings, support), user identity summary badge, switcher button, and sign out button.
- Main Workspace Header: Status pill badge, dynamic user greetings, live coins balance info card, and quick action buttons.
- Overview Tab: Getting started checklist (step actions and completions), recent missions grid, timing metrics cards, and empty state cards.
- Missions Tab: Search inputs, statuses filters, tabular listing of draft/pending/active/completed missions, launch actions, edit triggers, and confirmation dialogs.
- Wallets Tab: Coins packages pricing cards, coming-soon tags, payment simulator triggers, and transaction feedback alerts.
- Settings Tab: Founder details fields, save indicators, and full-screen delete account confirmations.
- Support Tab: Question cards list, troubleshooting guides, status indicators, and contact form anchors.

**Data handled**: Active coin balances, launch cost estimates, active missions, completed mission reviews, profiles.

**Current visual style**: Sleek dark slate layout, orange highlights, spring animated transitions, glass card overlays.

**Navigation connections**: Target: `/mission/wizard`, `/mission/status/[id]`, `/mission/insights/[id]`, `/mission/safety-review/[id]`.

## Tester Dashboard Page (/dashboard/tester)

**Purpose**: Let qualified testers view active assignments, request coin payouts, and modify preferred testing devices.

**Current layout**: Sidebar navigation (280px left), main tester container (fluid right). Sticky bottom nav on mobile viewports.

**Key components**:
- Sidebar: Brand banner, tab buttons (missions, settings, support), role switch buttons, and logout button.
- Main Header: Tab title labels, descriptions, and founder switcher.
- Missions Tab: Wallet balance summary panel, payout trigger button, active test invitations list, current task cards, timed-out histories, and abandon confirmations.
- Settings Tab: Tester display fields, preference modifications, and deletion confirmation dialog.
- Support Tab: Policy guidelines, FAQs, status logs, and support triggers.
- Payout Modal: Balance indicators, coin input forms, rupee conversion indicators, quick-fill buttons, validation warnings, and submit triggers.

**Data handled**: Tester balances, active invitations, completed counts, withdrawals, devices, skills.

**Current visual style**: Dark slate theme, teal check highlights, custom modal transitions, bold numeric values.

**Navigation connections**: Target: `/tester/workspace/[assignmentId]`, `/tester/verify`.

## Admin Dashboard Page (/dashboard/admin)

**Purpose**: Let platform administrators approve pending missions, reactivate users, award manual coins, and check system performance.

**Current layout**: Left sidebar control navigation (72px to 280px wide), full width table and metrics panels (right).

**Key components**: Sidebar tabs, overview stat cards, registration logs tables, pending missions review queue tables, approve/reject confirmation prompts, user listing search forms, coin adjustments panels, flag report groups, feedback grids, and zoomable screenshot portals.

**Data handled**: Platform metrics, user roles, mission approvals, flags, user feedbacks.

**Current visual style**: Dark grey scheme, red alert badges, clean numeric details, high-contrast tables.

**Navigation connections**: Direct navigation across overview and management segments.

## Mission Wizard Page (/mission/wizard)

**Purpose**: Provide a step-by-step form for founders to compile a new testing mission brief and submit it for review.

**Current layout**: Single-column form wizard. Top navigation banner, progress track, difficulty summary pill, centered main form container, step back/next action buttons, and checklist summary side-panel.

**Key components**:
- Brief Step: Mission title input, goal textareas, good-goal checklist, character counters, and inline validation warnings.
- Setup Step: Difficulty buttons (Easy/Medium/Hard), estimated minutes range slider, testers count range slider, deadline dropdown select, live cost estimate breakdown block (calculations, platform fees, balances, buy coins shortcuts), and assets list (link forms, screenshot upload zones, video drops, instructions textareas, and active reachability validation checks).
- Questions Step: proven question templates insert buttons, question forms list (MCQ inputs, rating previews, yes/no buttons, ordering arrows, and required flags).
- Review Step: Full overview brief summary panels, committed checklist validators (green/red ticks), cost breakdown calculations, draft saving buttons, and submit triggers.

**Data handled**: Title, goal, difficulty, testers count, timing, URLs, uploaded files, customized questions.

**Current visual style**: Glowing progress fills, focus indicators, custom sliders, cost breakdown panels.

**Navigation connections**: Source: founder dashboard. Target: `/dashboard/founder` on complete.

## Mission Status Page (/mission/status/[missionId])

**Purpose**: Allow founders to monitor live tester completions, review raw responses, and manage active mission runs.

**Current layout**: Scrollable status overview. Back link at top, horizontal status track, mission info details block, progress progress bar section (left/right split), metric details cards grid, status action controls bar, and completed responses scrollable list.

**Key components**: Back anchors, tracker steps, details, progress indicators, assigned/completed/timed-out metrics tiles, reassignment button `FindMoreTestersButton` (loading indicators, error labels), status actions (PAUSE / CLOSE / RESUME / VIEW INSIGHTS), confirmation dialog overlay, and accordion responses panels `TesterResponseCard` (tester initials, timeline stamps, question answers).

**Data handled**: Mission run metadata, assignment details, live responses, reassignment counters.

**Current visual style**: Sleek gray elements, glowing gradient indicators, pulse timers, spring accordions.

**Navigation connections**: Target: `/mission/insights/[missionId]`, `/dashboard/founder`.

## Mission Insights Page (/mission/insights/[missionId])

**Purpose**: Deliver a comprehensive report containing AI synthesis, metrics dashboards, response analysis, and tester rating controls.

**Current layout**: Scrollable multi-section dashboard. Back link header, status tracker, report overview card, metric summary grid, key AI insight highlight card, AI analysis section (left/right split), question analysis blocks list, tester ratings grid, and retest timeline scrollable chart.

**Key components**: Header back navigations, status progress indicators, PDF export actions, metrics tiles, AI highlight quote panel, key friction bullet lists, signal badges, response breakdown charts, accordion text feedback logs, tester rating forms `TesterRatingCard` (star selections, notes, flag modals), and timeline run cards.

**Data handled**: Total testers metrics, timing averages, clarity scores, AI recommendations, questionnaire statistics.

**Current visual style**: Premium slate styling, gold star rows, gradient indicator bars, spring hover scales, radial glows.

**Navigation connections**: Target: `/mission/wizard?edit=[id]`, `/mission/status/[id]`, `/dashboard/founder`.

## Mission Safety Review Page (/mission/safety-review/[missionId])

**Purpose**: Inform founders that their mission has been rejected, display administrator feedback, and prompt updates.

**Current layout**: Centered panel container layout.

**Key components**: Return link header, warning shield icon emblem, status badge labels, mission title labels, admin feedback card, next steps recommendations list, primary edit action button, and return home anchors.

**Data handled**: Rejection notes, mission titles, edit targets.

**Current visual style**: Light cream theme `#faf9f7`, high-contrast warning red panels, blue highlight lists.

**Navigation connections**: Source: founder dashboard items. Target: `/mission/wizard?edit=true&missionId=[id]`.

## Tester Verification Page (/tester/verify)

**Purpose**: Guide user-testers to confirm their testing device type and browser configuration.

**Current layout**: Centered verification workflow form.

**Key components**: Logo, title banner, shield status display, guide steps list, device selections grid, warning alerts, submit button, description summaries, and return buttons.

**Data handled**: Device profiles, user agent metadata.

**Current visual style**: Ivory backdrop, bold labels, amber highlights, shadow boundaries.

**Navigation connections**: Target: `/dashboard/tester` on completion.

## Tester Workspace Page (/tester/workspace/[assignmentId])

**Purpose**: Provide an interactive environment for testers to view mission goals, access assets, submit responses, and record their findings.

**Current layout**: Progressive stage workflow. Briefing view, interactive single-question slider view, submission check view, and success panel.

**Key components**:
- Header: brand check, countdown timer clock, outbound link warnings, time's up overlays.
- Briefing Stage: Mission title info, reward cards, estimated minutes, expiry timings, and assets list (linking, screen uploads, context notes).
- Questions Stage: glowing progress bar track, active prompt, star rating rows, choice grids, text textareas (character checkers, required tags), back/next buttons, and flag issue anchors.
- Review Stage: All answers summary lists, return edits links, and submit buttons.
- Success Stage: Congratulations header, reward values, reputation indicators, and dashboard return links.

**Data handled**: Answer structures, assignment IDs, device selections, timing metadata.

**Current visual style**: Dark slate color palette, green complete tags, countdown indicator dials, modal transitions.

**Navigation connections**: Target: `/dashboard/tester` on completion.

## Static Policy / Legal Pages (/terms, /privacy, /refund, /tester-payment-policy)

**Purpose**: Publish terms, privacy regulations, withdrawal details, and corporate policies for legal compliance.

**Current layout**: Centered single-column document layout.

**Key components**: Page header titles, introductory descriptions, updated timestamp labels, numeric sections lists, external contact anchors.

**Data handled**: Corporate regulations, email links.

**Current visual style**: Light text styling, spacing, neutral borders.

**Navigation connections**: Source: footer links across all pages. Target: `/contact`.

## Contact Page (/contact)

**Purpose**: Display options for users to contact support.

**Current layout**: Centered card layout.

**Key components**: return headers, titles, support email link, timing metrics, and guidance lists.

**Data handled**: Email URLs, team descriptions.

**Current visual style**: Dark slate gray panels, high-contrast links.

**Navigation connections**: Target: `/` (home).
