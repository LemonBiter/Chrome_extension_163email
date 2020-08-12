const AutoLoginBtn = document.getElementById("allowAutoLogin");  //popup上的自动登录打开按钮
const list = document.querySelector(".account_arr");         //popup上的用户列表
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
    AutoLoginBtn.checked = (result.switch === undefined) ? false : result.switch;
});


// 自动登录按钮点击事件，显示一键登录按钮在163页面上
AutoLoginBtn.addEventListener("click", function () {
    if (currentTab) {
        chrome.storage.local.set({switch: AutoLoginBtn.checked});
        let displayBtn = {enableLogin:AutoLoginBtn.checked}
        chrome.tabs.sendMessage(currentTab.id, JSON.stringify(displayBtn), response => {
        });

    }
});

//popup打开时,读取当前账户并显示在popup上
chrome.extension.sendMessage({getCurrentAccount:'get'}, function ({currentAccount}) {
    if(currentAccount&&currentAccount.userId){
        currentLine.innerHTML = `<h5>${currentAccount.account}</h5>`;
    } else {
        currentLine.innerHTML = '';
    }
});



//读取已记录的账号并显示在popup上

chrome.extension.sendMessage({displayArr:"displayArr"}, function ({accountInfo,currentAccount}) {
    if (accountInfo) {

        console.log(accountInfo);
        list.innerHTML = "";
        accountInfo.forEach(each => {
            console.log(each);
            each = JSON.parse(each);
            console.log(each);
            addToList(each);
        })
    }
    if (currentAccount&&currentAccount.account) {
        let selectedTr = document.getElementById('a' + currentAccount.userId);
        let label = selectedTr.querySelector('.selected');

        label.src = currentAccount.label?"/icon/g1.png":"/icon/g2.png";
    }
});


//添加账号按钮绑定动作
//绑定回车
document.addEventListener('keyup',function(e){
    (e.key ==="Enter")&&accountAdding();
});
//绑定点击
add.addEventListener('click', accountAdding);


function accountAdding() {
    if ((account.value) && (password.value)) {
        let thisAccount = {
            account: account.value,
            password: password.value,
            userId: Date.now(),
            label: false
        }


        chrome.extension.sendMessage({addAccount: thisAccount}, function (response) {
            console.log('this is the :',response);
        });

        //发送账号信息到background后，拉取更新后的用户数组，更新列表
        setTimeout(function () {
            chrome.extension.sendMessage({displayAll: "displayArr"}, function ({accountInfo}) {
                accountInfo = JSON.parse(accountInfo);
                list.innerHTML = "";
                accountInfo.forEach(eachAccount => {
                    addToList(eachAccount);
                })
            })
        }, 100);
    }
    account.value = "";
    password.value = "";
    account.focus();
}


//将当前账号信息放入list里，在popup上显示出来
function addToList(thisAccount) {

    let tr = document.createElement('tr');
    tr.innerHTML = `
                <td><i><img class="icon selected"  alt=""></i></td>
                <td>${thisAccount.account}</td>
                <td><i><img class="icon delete"  src="/icon/delete.png" alt=""></i></td>`;

    tr.querySelector(".selected").src = thisAccount.label?"/icon/g1.png":"/icon/g2.png";
    tr.id = "a" + thisAccount.userId;
    list.prepend(tr);

    //增加选中动作
    let currentSelector = tr.querySelector(`.selected`);
    currentSelector.style = "cursor: pointer";
    currentSelector.addEventListener("click", () => {
        //更改账号点击状态并发送给后台用于更新
        thisAccount.label = !thisAccount.label;
        chrome.extension.sendMessage({updateAccount:thisAccount},function(response){
           console.log(response);
        });
        //将popup上被点击的label按钮以外的其他label标记全部置灰
        let allSelector = document.getElementsByClassName('selected');
        for (let i = 0; i < allSelector.length; i++) {
            if (allSelector[i].closest('tr').id !== currentSelector.closest('tr').id) {
                allSelector[i].src = "/icon/g2.png";
            }
        }
        //将当前点击的label置亮
        currentSelector.src = /icon\/g2\.png/g.test(currentSelector.src)? label_light(thisAccount) : label_Dark();
    })


    //增加删除动作
    let deleteCurrent = tr.querySelector('.delete');
    deleteCurrent.addEventListener("click", () => {

        //发送要删除的账号信息到background，更新数据库
       chrome.extension.sendMessage({deleteAccount: thisAccount}, function (response) {
            console.log('deleted account:', response);
        })

        //如果删除的是当前账号，将popup当前账号栏清空
        if (/icon\/g1/g.test(tr.querySelector('.selected').src)) {
            currentLine.innerHTML = `<td></td>`
        }

        let index = [].indexOf.call(list.childNodes, tr);
        list.removeChild(list.children[index]);

    })
    deleteCurrent.style = "cursor: pointer";
}

//取消选中，发送取消信息到background
function label_Dark() {
    currentLine.innerHTML = `<td></td>`;
    chrome.extension.sendMessage({labelRecord:{account:'',label: false} });
    return "/icon/g2.png";
}

//选中，发送选中信息到background
function label_light(thisAccount) {
    currentLine.innerHTML = `<h4>${thisAccount.account}</h4>`;
    chrome.extension.sendMessage({labelRecord: thisAccount});

    return "/icon/g1.png";
}





class App{
    constructor(){
        this.show();
    }

    show(){
        console.log(this,123321);
    }

}

new App();