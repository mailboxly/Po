/*
    Po: Password organizer, from Mailboxly.
    Copyright (C) 2016 CrispQ Information Technologies Pvt. Ltd.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// globals: $, ko

(function () {
    "use strict";    
    
    var po = {};
    window.po = po;
    
    po.currentUser = null;
    
    // Globals :::::::::::::::::::::::::::::::::::::::::::::
    
    po.IS_PA = location.hostname === "po.mailboxly.com";
    if (po.IS_PA) {
        po.API_BASE = "https://pmmailboxly.pythonanywhere.com/api-v0/";
    } else {
        po.API_BASE = location.href.split("#")[0] + "api-v0/";
    }

    // Helpers :::::::::::::::::::::::::::::::::::::::::::::
    
    po.readForm = function (form) {
        var $form = $(form),
            $fields = $.merge(
                $form.find("input[name]"),
                $form.find("textarea[name]")//,
            ),
            data = {};
        $fields.each(function (i, field) {
            if (field.type === "password") {
                data[field.name] = field.value;
                field.value = ""; // Clear password.
            } else {
                data[field.name] = field.value.trim();
            }
        });
        return data;
    };
    po.hash = function (s) {
        return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(s));
    };
    po.encrypt = function (plaintext) {
        // AES-256-CCM
        return sjcl.encrypt(po.currentUser.mPassword, plaintext, {ks: 256});
    };
    po.decrypt = function (ciphertext) {
        return sjcl.decrypt(po.currentUser.mPassword, ciphertext);
    };
    po.showStatus = function (status) {
        $(".statusbar").text(status || "Loading ...");
    };
    po.hideStatus = function () {
        $(".statusbar").text("");
    };
    po.timedStatus = function (status, time_sec) {
        time_sec = time_sec || 2;
        po.showStatus(status);
        window.setTimeout(function () {
            po.hideStatus();
        }, time_sec * 1000);
    };
    po.api = function (name, dataToSend, callback) {
        var wrapper;
        wrapper = function (resp) {
            if (resp.status === "success") {
                callback(resp);
            } else {
               po.hideStatus();
               alert(resp.reason);
            }
        };
        return $.post(po.API_BASE + name, dataToSend, wrapper, "json");
    };
    po.pickRandom = function (seq) {
        var r = Math.floor((Math.random() * seq.length));
        return seq[r];
    };
    po.generatePassword = function (maxLength/*=30*/) {
        var charset, password, i;
        maxLength = maxLength || 30;
        charset =  (
            "abcedfghijklmnopqrstuvwxyz" +
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "0123456789" + "`-=[];',./" +
            "!@#$%^&*()" + "~_+{}:\"<>?"
        );
        password = "";
        for (i = 0; i < maxLength; i += 1) {
            password += po.pickRandom(charset);
        };
        return password;
    };

    // Routing :::::::::::::::::::::::::::::::::::::::::::::
    
    window.onhashchange = function () {
        var id, $screen, $others, handler;
        id = location.hash.slice(1) || "arbitrary";
        $screen = $("div.screen#" + id);
        $others = $("div.screen:not(#" + id + ")");
        handler = po[id] && po[id].open;
        if (!$screen.length) {
            location.hash = "index";
            return null;
        }
        if (handler) {
            handler();
        };
        $others.hide();
        $screen.fadeIn();
        $("html").scrollTop(0);
    };
    window.onload = function () {
        window.onhashchange();
    };
    
    // Signup ::::::::::::::::::::::::::::::::::::::::::::::
    
    po.signup = {};
    po.signup.open = function () {
        if (po.currentUser) {
            location.hash = "dash";
        } else {
            console.assert(po.currentUser === null);
        }
    };
    po.signup.$form = $("#signup form");
    po.signup.validate = function (fdata) {
        // TODO
        return true;
    };
    po.signup.$form.on("submit", function (event) {
        var fdata, mHash, dataToSend;
        event.preventDefault();
        po.showStatus("Signing up ...");
        fdata = po.readForm(event.target);
        po.signup.validate(fdata);   // TODO: Write validator.
        mHash = po.hash(fdata.mPassword);
        dataToSend = {
            "username": fdata.username.toUpperCase(),
            "mHash": mHash,
            "hint": fdata.hint,
            "email": fdata.email
        };
        po.api("signup", dataToSend, function (sResp) {
            po.signup.handleSignupResp(sResp, fdata, mHash);
        });
    });
    po.signup.handleSignupResp = function (sResp, fdata, mHash) {
        po.hideStatus();
        po.currentUser = $.extend({}, fdata);
        po.currentUser.mHash = mHash;
        location.hash = "dash";
    };
    
    // Login :::::::::::::::::::::::::::::::::::::::::::::::
    
    po.login = {};
    po.login.open = function () {
        if (po.currentUser) {
            location.hash = "dash";
        } else {
            console.assert(po.currentUser === null);
        }
    };
    po.login.$form = $("#login form");
    po.login.validate = function (fdata) {
        // TODO
        return true;
    };
    po.login.$form.on("submit", function (event) {
        var fdata, mHash, dataToSend;
        event.preventDefault();
        po.showStatus("Logging in ...");
        fdata = po.readForm(event.target);
        po.login.validate(fdata);   // TODO: Write validator.
        mHash = po.hash(fdata.mPassword);
        dataToSend = {
            "username": fdata.username.toUpperCase(),
            "mHash": mHash
        };
        po.api("login", dataToSend, function (lResp) {
            po.login.handleLoginResp(lResp, fdata, mHash);
        });
    });
    po.login.handleLoginResp = function (lResp, fdata, mHash) {
        var ct, pt, rawData;
        po.hideStatus();
        po.currentUser = $.extend({}, fdata, lResp.user);
        po.mHash = mHash;
        ct = lResp.user.ct;
        if (ct) {
            //pt = sjcl.decrypt(po.currentUser.mPassword, ct);
            pt = po.decrypt(ct);
            rawData = JSON.parse(pt);
            po.dash.data(rawData.map(function (rawItem) {
                /*var item;
                item = {};
                item.
                Object.keys(rawItem).forEach(function (key) {
                    item[key] = ko.observable(rawItem[key]);
                });
                return item;*/
                return {
                    id: ko.observable(rawItem.id),
                    service: ko.observable(rawItem.service),
                    username: ko.observable(rawItem.username),
                    email: ko.observable(rawItem.email),
                    password: ko.observable(rawItem.password),
                    extra: ko.observable(rawItem.extra),
                    isEditable: ko.observable(false),
                    isRevealed: ko.observable(false)//,
                };
            }));
        } else {
            po.dash.data([]);
        }
        location.hash = "dash";
    };
    
    // Dashboard (AKA Dash) ::::::::::::::::::::::::::::::::
    
    po.dash = {};
    po.dash.open = function () {
        if (!po.currentUser) {
            location.hash = "index";
        } else {
            console.assert(po.currentUser);
        }
    }
    po.dash.data = ko.observableArray([]);
    po.dash.sync = function () {
        var pt, ct, dataToSend;
        pt = ko.toJSON(po.dash.data);
        //ct = sjcl.encrypt(po.currentUser.mPassword, pt);
        ct = po.encrypt(pt);
        dataToSend = {
            username: po.currentUser.username.toUpperCase(),
            mHash: po.currentUser.mHash,
            ct: ct
        };
        po.api("updateCt", dataToSend, function (uResp) {
            po.timedStatus("Your data has been encrypted and synced.");
        });
    };
    po.dash.addItem = function () {
        var item = {
            id: Date.now(),
            service: ko.observable(""),
            username: ko.observable(""),
            email: ko.observable(""),
            password: ko.observable(""),
            extra: ko.observable(""),
            isEditable: ko.observable(true),
            isRevealed: ko.observable(false)//,
        };
        po.dash.data.unshift(item);
        // Not calling po.dash.sync();
    };
    po.dash.acceptItem = function (item) {
        item.isEditable(false);
        po.dash.sync();
    };
    po.dash.editItem = function (item) {
        item.isEditable(true);
        // Not calling po.dash.sync();
    };
    po.dash.removeItem = function (item) {
        po.dash.data.remove(item);
        po.dash.sync();
    };
    po.dash.revealPassword = function (item) {
        item.isRevealed(true);
    };
    po.dash.concealPassword = function (item) {
        item.isRevealed(false);
    };
    po.dash.generatePassword = function (item) {
        var password;
        password = po.generatePassword();
        prompt(
            "A new password has been generated.\n" + 
            "To copy, press Crtl+C and then Enter.",
            password
        );
        item.password(password);
    };
    po.dash.promptPassword = function (item) {
        var password;
        password = item.password();
        if (password) {
            prompt(
                "Here's your password.\n" +
                "To copy, press Crtl+C and then Enter.",
                password
            );
        } else {
            alert(
                "Your password is empty."
            );
        }
    };
    po.dash.logout = function () {
        po.currentUser = null;
        po.dash.data([]);
        location.hash = "index";
    };
    ko.applyBindings(po.dash, $("#dash")[0]);
    
    /*po.api("ping", {}, function (resp) {
        alert(JSON.stringify(resp));
    });*/

}());
