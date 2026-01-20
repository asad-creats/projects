# Migration Guide: From Monolithic to Modular

This guide helps you migrate from the original single-file Todo component to the refactored modular structure.

## 🎯 Quick Migration (2 minutes)

### Option 1: Direct Replacement
If you just want to use the refactored version as-is:

```javascript
// In your main App.js or router file:

// OLD:
import Todo from './Todo';

// NEW:
import Todo from './todo-app-refactored/Todo';

// That's it! Everything else works the same.
```

### Option 2: Named Import
Use the index file for cleaner imports:

```javascript
import { Todo } from './todo-app-refactored';
```

## 📋 Step-by-Step Migration

### Step 1: Copy Files
```bash
# Copy the entire refactored folder to your project
cp -r todo-app-refactored/ /your/project/src/
```

### Step 2: Update Import Path
```javascript
// Find this in your app:
import Todo from './Todo';

// Replace with:
import Todo from './todo-app-refactored/Todo';
```

### Step 3: Verify supabaseClient Path
The refactored code expects `supabaseClient.js` to be at:
```
src/
├── supabaseClient.js          ← Should be here
└── todo-app-refactored/
    └── hooks/
        └── useTodos.js        ← Imports from '../supabaseClient'
```

If your `supabaseClient.js` is elsewhere, update the import in `hooks/useTodos.js`:
```javascript
// Change this line to match your structure:
import { supabase } from '../supabaseClient';
```

### Step 4: Test
Run your app and verify:
- [ ] Tasks load from database
- [ ] Can create new tasks
- [ ] Can toggle task completion
- [ ] Can delete tasks
- [ ] Ollama connection works
- [ ] AI assistant responds
- [ ] Task suggestions work

## 🔧 Customization After Migration

### Changing Theme Colors
Edit `styles/theme.js`:
```javascript
export const theme = {
  accent: '#6366f1',  // Change to your brand color
  // ... other colors
};
```

### Adding a New Task Field
1. Update database schema in Supabase
2. Modify `hooks/useTodos.js` (addTodo function)
3. Update `components/AddTaskForm.jsx` (add input field)
4. Update `components/TaskItem.jsx` (display new field)

### Adding a New AI Tool
1. Add tool definition in `services/taskAgent.js` (tools array)
2. Implement the tool in `executeTool()` method
3. Update system prompt to include the new tool

### Changing Styles
All styles are in `styles/styles.js`. Modify the style objects:
```javascript
export const styles = {
  taskCard: {
    background: '#fff',     // Change this
    padding: '1rem',        // Or this
    borderRadius: '12px',   // Or this
    // ...
  }
};
```

## 🐛 Common Migration Issues

### Issue 1: "Cannot find module '../supabaseClient'"
**Solution**: Update the import path in `hooks/useTodos.js` to match your project structure.

### Issue 2: Styles not applying
**Solution**: Make sure the animation keyframes are being injected. Check that `styles/styles.js` is imported.

### Issue 3: Ollama not connecting
**Solution**: This is the same as before - ensure Ollama is running on `localhost:11434`.

### Issue 4: "React Router Link not working"
**Solution**: Make sure you have `react-router-dom` installed:
```bash
npm install react-router-dom
```

## 📦 Dependencies Check

Ensure you have these installed:
```bash
npm install react react-dom
npm install react-router-dom
npm install @supabase/supabase-js
```

No new dependencies are needed! The refactored version uses the same libraries.

## 🔄 Rollback Plan

If you need to rollback to the original:

1. **Keep the original file**: Don't delete `Todo.js` until you're confident
2. **Use version control**: Commit before and after migration
3. **Quick rollback**:
   ```javascript
   // Just change the import back:
   import Todo from './Todo';  // Original version
   ```

## 🎨 Benefits You'll See Immediately

1. **Easier to find code**: Need to change task styling? Check `TaskItem.jsx`
2. **Faster debugging**: Error in task creation? Check `useTodos.js` hook
3. **Better IDE support**: Smaller files = better autocomplete and intellisense
4. **Easier collaboration**: Team members can work on different components
5. **Simpler testing**: Test individual components and hooks separately

## 📊 File Location Reference

| What you want to change | Where to look |
|-------------------------|---------------|
| Task card appearance | `components/TaskItem.jsx` |
| Task creation form | `components/AddTaskForm.jsx` |
| AI chat interface | `components/AgentChat.jsx` |
| Colors and theme | `styles/theme.js` |
| Database operations | `hooks/useTodos.js` |
| AI logic and tools | `services/taskAgent.js` |
| Ollama integration | `services/ollamaClient.js` |
| Date formatting | `utils/dateUtils.js` |
| Statistics calculation | `hooks/useTodos.js` |
| Main layout | `Todo.jsx` |

## ✅ Post-Migration Checklist

After migration, verify:

- [ ] All tasks display correctly
- [ ] Task creation works (manual and AI)
- [ ] Task completion toggles
- [ ] Task deletion works
- [ ] Filters work (all/active/completed)
- [ ] Category filters work
- [ ] Statistics are accurate
- [ ] AI assistant connects
- [ ] Task suggestions generate
- [ ] Dates display correctly ("Today", "Tomorrow", etc.)
- [ ] Overdue tasks show warning
- [ ] No console errors
- [ ] No React warnings

## 🆘 Getting Help

If you encounter issues:

1. Check console for errors
2. Verify all import paths are correct
3. Ensure `supabaseClient` is accessible
4. Check that Ollama is running
5. Compare file structure with the README

## 🎓 Learning the New Structure

Recommended reading order to understand the refactored code:

1. `README.md` - Overview and structure
2. `utils/dateUtils.js` - Simple utilities (easiest)
3. `styles/theme.js` - Theme constants
4. `components/TaskItem.jsx` - See how a component works
5. `hooks/useTodos.js` - Understand data management
6. `Todo.jsx` - See how everything connects

## 🚀 Next Steps

After successful migration:

1. Add tests for components and hooks
2. Set up Storybook for component documentation
3. Consider adding TypeScript for type safety
4. Optimize performance with React.memo if needed
5. Add error boundaries for better error handling

Happy migrating! 🎉
