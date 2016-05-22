var po = {};

po.api = function (name, dataToSend, callback) {
    var base = "https://pmmailboxly.pythonanywhere.com/api/";
    $.post(base + name, dataToSend, callback, "json"); 
};

po.api("ping", {}, function (resp) {
    alert(JSON.stringify(resp));
});
