chrome.runtime.onMessage.addListener(function (request, sender, sendRequest) {
    const KEEP_CHANNEL_OPEN = true;
    if(request.displayAll){
        chrome.storage.local.get(["currentAccount", "accountInfo"], function (result) {
        sendRequest(result);
    })}


    //删除指定账号，返回一个更新后的账号数组
    else if (request.getData) {
        chrome.storage.local.get(["currentAccount", "accountInfo"], function (result) {
            let all = result.accountInfo;
            let one = result.currentAccount;

            let selected = all.filter(each => each.account === one);
            sendRequest(selected[0]);
        })

        //账号选中状态
    } else if (request.currentAccount) {
        console.log(request.labeled);
        chrome.storage.local.set({currentAccount: request.currentAccount,labeled:request.labeled}, function () {
            console.log(request.currentAccount, 'saved as current account');
        })
    } else if (request.deleteAccount) {
        remove(request);

    } else if(request.user){
        add(request);

    }

    return KEEP_CHANNEL_OPEN;
})


//往用户数组增加新的账号信息
function add({user}) {
    chrome.storage.local.get(["accountInfo"], arr => {
        let accountArray = arr["accountInfo"] ? arr["accountInfo"] : [];
        let temp = [];
        if (accountArray.length === 0)
            accountArray.push(user);
        else {
            accountArray.forEach(each => {
                temp.push(each.account);
            });
            if (!temp.includes(user.account)) {
                accountArray.push(user);
            }
        }
        chrome.storage.local.set({accountInfo: accountArray}, function () {
            console.log("account add successful...");
        })
    })
}

//从账户数组移除用户
function remove({deleteAccount}) {
    chrome.storage.local.get(["accountInfo"], arr => {
        let accountArray = arr["accountInfo"];
       let newAccountArray =  accountArray.filter((each) => each.account !== deleteAccount);
        chrome.storage.local.set({accountInfo: newAccountArray}, function () {
            console.log("account delete successful...");
        })
    })
}

function getAccountInfo() {
    return new Promise(resolve => {
        chrome.storage.local.get(["accountInfo"], function (result) {
            resolve(result.accountInfo);
        })
    })
}

function getCurrentAccount() {
    return new Promise(resolve => {
        chrome.storage.local.get(["currentAccount","labeled"], function (result) {
            resolve(result);
        })
    })
}


