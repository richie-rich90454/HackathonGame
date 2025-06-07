let {app, BrowserWindow}=require("electron");
let path=require("path");
let child_process=require("child_process");
let {Menu}=require("electron");
function createWindow(){
    let win=new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences:{
            nodeIntegration: false
        },
        icon: path.join(__dirname, "favicon.ico")
    });
    if (process.platform!=="darwin"){
        Menu.setApplicationMenu(null);
    }
    else{
        Menu.setApplicationMenu(Menu.buildFromTemplate([]));
    }
    win.loadURL("http://localhost:6008");
}
app.whenReady().then(()=>{
    child_process.spawn("node", ["server.js"],{
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });
    createWindow();
});
