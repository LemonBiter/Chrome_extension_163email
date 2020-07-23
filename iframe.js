let d = document.createElement("button");
d.innerText = "一键登录";
let dStyle = "background: #3280fc;color: #ffffff;padding: 3px 6px; border-radius: 6px;margin-left: 10px;"
d.setAttribute("style",dStyle);
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
        console.log(response);
        if (response) {
            d.innerText = "登陆中...";
            setTimeout(()=>{
                d.innerText = "一键登录";
            },1000);
            let accountInput = document.querySelectorAll("input")[0];
            accountInput.value = response.account;

            let passwordInput = document.querySelector("input[name='password']");
            passwordInput.value = response.password;

            let clickBtn = document.querySelector("#dologin");
            clickBtn.click();
        }
        else{
            d.innerText = "未选中账号";
            setTimeout(()=>{
                d.innerText = "一键登录";
            },500);
        }


    })


});



