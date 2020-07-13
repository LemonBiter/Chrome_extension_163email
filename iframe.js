let d = document.createElement("button");
d.innerText = "一键登录";
document.body.before(d);


chrome.storage.local.get(["display"], function (result) {
    if (!result.display) {
        d.style.display = 'none';
    }
});

let accountDetails;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (typeof request == "object") {
        accountDetails = request;
    } else if (typeof request == "boolean") {
        chrome.storage.local.set({display: request});
        if (request) {
            d.style.display = 'block'
        } else {
            d.style.display = 'none'
        }
    }

    sendResponse("Copy that");
});


//点击从background获取当前用户数据
d.addEventListener("click", () => {
    chrome.runtime.sendMessage({
        getData:'give me current account info'
    },response=>{


        //填入输入框并点击按钮
        if (response) {
            let accountInput = document.querySelectorAll("input")[0];
            accountInput.value = response.account;

            let passwordInput = document.querySelector("input[name='password']");
            passwordInput.value = response.password;

            let clickBtn = document.querySelector("#dologin");
            clickBtn.click();
        }

    })


});



