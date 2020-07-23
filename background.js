//监听当前页面，小图标红蓝切换
chrome.tabs.onActivated.addListener(() => {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        if (/:\/\/mail.163.com\/*/g.test(tabs[0].favIconUrl)) {
            chrome.browserAction.setIcon({
                path: "popup/blue_38.png"
            })
        } else {
            chrome.browserAction.setIcon({
                path: "popup/red_38.png"
            })
        }
    });
})


chrome.runtime.onMessage.addListener(function (request, sender, sendRequest) {
    const KEEP_CHANNEL_OPEN = true;

    //向数据库增加用户
    if (request.addAccount) {
        add(request);
    }
    //从数据库删减用户
    else if (request.deleteAccount) {
        remove(request);
    }
    //更新账户的选中或未选中信息
    else if (request.updateAccount) {
        update(request);
    }

    //等待被popup.js call，用于展示已记录账号
    else if (request.displayAll) {
        chrome.storage.local.get(["accountInfo", "currentAccount"], function (result) {
            console.log(result)
            sendRequest(result);
        })
    } else if (request.currentAccount) {
        let thisAccount = request.currentAccount;
        if (thisAccount.label) {
            chrome.storage.local.set({currentAccount: thisAccount}, function () {
                console.log(request.currentAccount, 'saved as current account.');
            })
        } else {
            chrome.storage.local.set({currentAccount: thisAccount}, function () {
                console.log(request.currentAccount, 'do not have current account yet.');
            })
        }

    } else if (request.getCurrentAccount) {
        chrome.storage.local.get(["currentAccount"], function (result) {
            sendRequest(result);
        })
    }


    //点击一键登录，从此处获取当前账号数据
    else if (request.getData) {
        chrome.storage.local.get(["currentAccount", "accountInfo"], function (result) {
            console.log(result);
            let all = result.accountInfo;
            let one = result.currentAccount;
            if (all && one) {
                let selected = all.filter(each => each.userId === one.userId);
                sendRequest(selected[0]);
            }
        })

        //账号选中状态
    }

    return KEEP_CHANNEL_OPEN;
})


//往用户数组增加新的账号信息
function add({addAccount}) {
    console.log(addAccount);
    chrome.storage.local.get(["accountInfo"], arr => {
        let accountArray = arr["accountInfo"] ? arr["accountInfo"] : [];
        accountArray.push(addAccount);

        chrome.storage.local.set({accountInfo: accountArray}, function () {
            console.log(`${addAccount["account"]} adding successful...`);
        })
    })
}

//从账户数组移除用户
function remove({deleteAccount}) {
    chrome.storage.local.get(["accountInfo", "currentAccount"], arr => {
        let accountArray = arr["accountInfo"];
        let newAccountArray = accountArray.filter((each) => each.userId !== deleteAccount.userId);
        chrome.storage.local.set({accountInfo: newAccountArray}, function () {
            console.log(`${deleteAccount.account} delete successful...`);
        })
        if (arr["currentAccount"].userId === deleteAccount.userId) {
            chrome.storage.local.set({currentAccount: {account: '', password: '', userId: 0, label: ''}});
        }
    })
}

//储存账户的选中与取消选中标记
function update({updateAccount}) {
    chrome.storage.local.get(["accountInfo"], arr => {
        let accountArray = arr["accountInfo"];
        accountArray.forEach((each, index) => {
            if (each.userId === updateAccount.userId) {
                accountArray[index] = updateAccount;
            } else {
                each.label = false;
            }
        })
        chrome.storage.local.set({accountInfo: accountArray}, function () {
            console.log("account update successful...");
        })
    })


}