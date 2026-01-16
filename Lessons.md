# Critical Fix: Mobile Keyboard & Viewport Stability

## The Issue
On mobile devices (specifically iOS Safari), the visual keyboard often overlays fixed-positioned elements (like chat inputs) at the bottom of the screen.
This occurs because Safari resizes the **Visual Viewport** but NOT the **Layout Viewport** when the keyboard opens. `position: fixed; bottom: 0;` attaches to the Layout Viewport, leaving the input hidden behind the keyboard.

## The Solution

We implemented a 3-part fix to ensure a native-like experience:

### 1. `interactive-widget: resizes-content`
We added this property to the `viewport` metadata in `app/layout.tsx`.
**What it does:** It forces the browser to resize the *Layout Viewport* when the keyboard appears. This means `bottom: 0` is now calculated relative to the *top of the keyboard*, pushing our input field up automatically.

```tsx
// app/layout.tsx
export const viewport: Viewport = {
  // ...
  interactiveWidget: "resizes-content",
};
```

### 2. Dynamic Viewport Units (`dvh`)
We switched from `vh` to `dvh` (Dynamic Viewport Height) for the main layout containers.
**What it does:** `100dvh` adapts to the dynamic expansion/contraction of the mobile address bar. `100vh` is static and often results in content being cut off.

### 3. Strict Height Constraints
We enforced a calculated height on the Inbox container:
`h-[calc(100dvh-8rem)]` (Mobile) / `h-[calc(100dvh-4rem)]` (Desktop).

**What it does:**
- Prevents the `body` from scrolling.
- Forces the internal message list (`flex-1 overflow-y-auto`) to handle all scrolling.
- Keeps the input field pinned at the bottom-most visible pixel.
- if we didn't do this, the keyboard would push the entire page up, often scrolling the input off the top of the screen or causing "jumpy" behavior.
