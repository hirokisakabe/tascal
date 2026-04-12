# tascal

CLI for [tascal](https://github.com/hirokisakabe/tascal) — a calendar-based task management app.

## Install

```bash
npm install -g tascal
```

## Usage

```bash
# Log in to tascal
tascal login

# List tasks
tascal list
tascal list --month 4 --year 2026

# Add a task
tascal add --title "Buy milk" --date 2026-04-12

# Edit a task
tascal edit <id> --title "Buy oat milk"

# Mark as done / undo
tascal done <id>
tascal undo <id>

# Delete a task
tascal delete <id>

# Log out
tascal logout
```

## Commands

| Command  | Description                           |
| -------- | ------------------------------------- |
| `login`  | Authenticate with your tascal account |
| `logout` | Remove stored credentials             |
| `list`   | List tasks for a given month          |
| `add`    | Create a new task                     |
| `edit`   | Update an existing task               |
| `done`   | Mark a task as done                   |
| `undo`   | Mark a task as not done               |
| `delete` | Delete a task                         |

## License

MIT
