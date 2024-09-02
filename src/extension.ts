// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  window,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  workspace,
} from 'vscode'
import find from 'find-process'
import pidusage from 'pidusage'
import os from 'node:os'

function getProcessSearchTerm() {
  if (process.execPath?.match(/Cursor Helper/)) {
    return 'Cursor'
  }
  return 'Visual Studio Code'
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(new VSMemory())
}

class VSMemory {
  private _totalMemory = os.totalmem()
  private _statusBarItem: StatusBarItem = window.createStatusBarItem(
    StatusBarAlignment.Right
  )

  constructor() {
    this.update(this._statusBarItem)
    this._statusBarItem.show()
  }

  private update(statusBarItem: StatusBarItem) {
    const config = workspace.getConfiguration('vscodememoryusage')

    const searchTerm = getProcessSearchTerm()

    return find('name', searchTerm, true).then((list) => {
      const pids = list.map((item) => item && item.pid)
      pidusage(pids, (err: Error, stats: any[]) => {
        if (err) {
          console.log(err)
          return
        }

        const usageBytes = Object.keys(stats).reduce((prev: any, key: any) => {
          return prev + stats[key].memory
        }, 0)
        const usageGiB = usageBytes / (1024 * 1024 * 1024)
        const totalGiB = this._totalMemory / (1024 * 1024 * 1024)
        const difference = totalGiB - usageGiB

        statusBarItem.text = `${
          difference < usageGiB - 3 ? `$(alert)` : ''
        } ${usageGiB.toFixed(2)} / ${totalGiB} GiB`
        setTimeout(
          () => this.update(statusBarItem),
          config.get('frequency', 2000)
        )
      })
    })
  }

  dispose() {
    this._statusBarItem.dispose()
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
