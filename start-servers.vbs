Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Dinesh Raj Upadhya\Downloads\Smart-Cafe-Order-main\backend"
WshShell.Run "node server.js", 0, False

Set WshShell2 = CreateObject("WScript.Shell")
WshShell2.CurrentDirectory = "C:\Users\Dinesh Raj Upadhya\Downloads\Smart-Cafe-Order-main\frontend"
WshShell2.Run "cmd /c npm start", 0, False

WScript.Echo "Smart Cafe servers started!"
