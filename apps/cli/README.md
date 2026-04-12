# tascal-cli

CLI for [tascal](https://github.com/hirokisakabe/tascal) — a calendar-based task management app.

## Install

```bash
npm install -g tascal-cli
```

## Usage

```bash
# Log in to tascal
tascal-cli login

# List tasks
tascal-cli list
tascal-cli list --month 4 --year 2026

# Add a task
tascal-cli add --title "Buy milk" --date 2026-04-12

# Edit a task
tascal-cli edit <id> --title "Buy oat milk"

# Mark as done / undo
tascal-cli done <id>
tascal-cli undo <id>

# Delete a task
tascal-cli delete <id>

# Log out
tascal-cli logout
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
