const AutoLoginBtn = document.getElementById("allowAutoLogin");  //popup上的自动登录打开按钮
const list = document.querySelector(".list");         //popup上的用户列表
const account = document.getElementById("account");  //输入的用户名
const password = document.getElementById("password"); //输入的密码
const add = document.getElementById("add");            //添加用户按钮
const currentLine = document.getElementById('current');   //pop上的当前账号栏
AutoLoginBtn.disabled = true;  //自动登录按钮初始为关闭状态


//判定当前页面是否为163 email，自动登陆按钮是否可以点击
let currentTab;
chrome.tabs.query({
    active: true,
    currentWindow: true
}, function (tabs) {
    if (/:\/\/mail.163.com\/*/g.test(tabs[0].favIconUrl)) {
        AutoLoginBtn.disabled = false;
        currentTab = tabs[0];
    }
});


//每一次popup打开，判定当前按钮是开是关
chrome.storage.local.get(["switch"], function (result) {
    console.log(result.switch?'可以登陆':"不能登陆");

    AutoLoginBtn.checked = (result.switch === undefined)?false:result.switch;
});


// 显示一键登录按钮在163页面上
AutoLoginBtn.addEventListener("click", function () {

    if (currentTab) {
        chrome.storage.local.set({switch: AutoLoginBtn.checked});
        chrome.tabs.sendMessage(currentTab.id, AutoLoginBtn.checked, response => {
        });

    }
});

//读取当前账户并显示在popup上
setTimeout(function () {
    chrome.extension.getBackgroundPage().getCurrentAccount().then(
        result => {
            console.log(result);
            if (result.currentAccount) {
                currentLine.innerHTML = `<td>${result.currentAccount}</td>`;
            } else {
                currentLine.innerHTML = '';
            }
        }
    )
}, 100);


//读取已记录的账号并显示在popup上

    chrome.extension.sendMessage({displayAll:'displayArr'},function (response) {
       let accountInfo = response.accountInfo;
       let currentAccount = response.currentAccount;
       if(accountInfo){
           list.innerHTML = "";
                accountInfo.forEach(each => {
                    addToList(each.account);
                })
       }
       if(currentAccount){
           console.log(currentAccount);
       let selectedTr = document.getElementById('a'+currentAccount);
       let label = selectedTr.querySelector('.selected');
       label.src = "/icon/g1.png";
       }
    });


    //添加账号按钮绑定动作
add.addEventListener('click', function () {

    if ((account.value) && (password.value)) {
        let accVal = account.value;
        let paVal = password.value;
        chrome.extension.sendMessage({user:{account: accVal, password: paVal}}, function (response) {
            // response 是background 收到消息后的返回数据
            console.log(response);
        });

        //发送账号信息到background后，拉取更新后的用户数组，更新列表
        setTimeout(function () {
            chrome.extension.getBackgroundPage().getAccountInfo().then(result => {
                    console.log(result);
                    list.innerHTML = "";
                    result.forEach(each => {
                        addToList(each.account);
                    })
                }
            );
        }, 100);

    }
});



function addToList(account) {

    let tr = document.createElement('tr');
    tr.innerHTML = `
                <td><i><img class="icon selected"   src="/icon/g2.png" alt=""></i></td>
                <td>${account}</td>
                <td><i><img class="icon delete"  src="/icon/delete.png" alt=""></i></td>`;
    tr.id = "a" + account;

    list.prepend(tr);

    //增加选中动作
    let currentSelector = tr.querySelector(`.selected`);
    currentSelector.addEventListener("click", () => {
        let allSelector = document.getElementsByClassName('selected');

        for (let i = 0; i < allSelector.length; i++) {
            if (allSelector[i].closest('tr').id !== currentSelector.closest('tr').id) {
                allSelector[i].src = "/icon/g2.png";
            }
        }
        currentSelector.src = /icon\/g2/g.test(currentSelector.src) ? label_light(account) : label_Dark();
    })

    //增加删除动作
    let deleteCurrent = tr.querySelector('.delete');
    deleteCurrent.addEventListener("click",()=>{
        chrome.extension.sendMessage({deleteAccount:account},function(response){
            console.log('deleted account:',response);
        })

        console.log(tr.querySelector('.selected'));
        console.log(tr.querySelector('.selected').src);
        if (/icon\/g1/g.test(tr.querySelector('.selected').src)) {
            currentLine.innerHTML = `<td></td>`
        }

        let index = [].indexOf.call(list.childNodes,tr);
        list.removeChild(list.children[index]);

    })
}

//取消选中，发送取消信息到background
function label_Dark(){
    currentLine.innerHTML = `<td></td>`;
    chrome.extension.sendMessage({currentAccount: ' ',labeled:false});
    return "/icon/g2.png";
}

//选中，发送选中信息到background
function label_light(account){
    currentLine.innerHTML = `<td>${account}</td>`;
    chrome.extension.sendMessage({currentAccount: account,labeled:true});

    return "/icon/g1.png";
}
