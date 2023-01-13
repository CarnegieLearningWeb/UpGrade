# Key Value Bubble Debugger Tool

When in non-production mode, you can use this custom tool to do a little console.log for values right on the screen.

It will show up when component (or service or whatever) is created, get live data updates, and get destroyed when component is removed.

You can drag it to where you like. (WIP: saving position in localstorage so it will stay there after reloading. Stay tuned!)

Copy and paste this snippet into a `.ts` file and log out class values in little moveable bubbles on the UI:

```html
<app-key-value-bubble
  key=""
  [value]=""
  >
</app-key-value-bubble>

