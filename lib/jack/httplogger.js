// -*- coding: utf-8 -*-
//httplogger.js ---
//
// Copyright (C) MIT License
// Tampere University of Technology
//
// Created: Wed May 19 13:21:15 2010 (+0300)
// Author: wuher
//
// todo: optimization
//


var hashp = require("hashp").HashP;
var trim = require("util").trim;
var sprintf = require("printf").sprintf;
var printf = require("printf").printf;

var INDENT = "  ";
var INDENT_LEN = INDENT.length;


/**
 * prints the given message
 *
 * @param sz the message (key:value pair)
 * @param caption the caption of the row (defaults to HTTP)
 * @param res true for response headers and false for request headers
 * @param spaces enough spaces to fill maximum indentation level
 * @param indentlevel the indentation level
 */
var print_ = function (sz, caption, res, spaces, indentlevel) {
    res = (res) ? "_RES" : "_REQ";
    caption = caption || "HTTP";
    spaces = spaces || "";
    indentlevel = indentlevel || 0;
    spaces = (spaces.substring(spaces.length - (indentlevel * INDENT_LEN)));

    // @todo write to log instead
    printf("[%s%s] %s%s", caption, res, spaces, sz);
};


/**
 * print all authentication information
 */
exports.AuthLogger = function (app, req_authkey, res_authkey) {
    return function (req) {
        var i, res, auths,
        req_authkey = req_authkey || "authorization",
        res_authkey = res_authkey || "www-authenticate";

        // @todo code duplication..

        // log request headers
        if (hashp.includes(req.headers, req_authkey)) {
            auths = hashp.get(req.headers, req_authkey).split(",");
            for (i = 0; i < auths.length; i += 1) {
                print_(trim(auths[i]), "AUTH");
            }
        }

        // invoke the app
        res = app(req);

        // log response headers
        if (hashp.includes(res.headers, res_authkey)) {
            auths = hashp.get(res.headers, res_authkey).split(",");
            for (i = 0; i < auths.length; i += 1) {
                print_(trim(auths[i]), "AUTH", true);
            }
        }

        return res;
    };
};


/**
 * print all http request and response headers
 *
 * @param reqlvl maximum depth when printing nested http parameters.
 *               Default is 1. 0 is the first level.
 * @param reslvl see reqlvl
 */
exports.HttpLogger = function (app, reqlvl, reslvl) {
    var printobj, i, reqspaces = "", resspaces = "";

    reqlvl = reqlvl || 1;
    reslvl = reslvl || 1;
    for (i = 0; i < reqlvl; i += 1) reqspaces += INDENT;
    for (i = 0; i < reslvl; i += 1) resspaces += INDENT;

    /// helper for printing objects recursively
    printobj = function (obj, res, spaces, maxlevel, currlevel) {
        var prop;
        maxlevel = maxlevel || 0;
        currlevel = currlevel || 0;
        for (prop in obj) {
            if (typeof obj[prop] === "object" && currlevel < maxlevel) {
                print_(prop + ":", "HTTP", res, spaces, currlevel);
                printobj(obj[prop], res, spaces, maxlevel, currlevel + 1);
            } else if (typeof obj[prop] !== "function") {
                print_(prop + ": " + obj[prop], "HTTP", res, spaces, currlevel);
            }
        }
    };

    return function (req) {
        var res;

        if (reqlvl >= 0) {
            printobj(req, false, reqspaces, reqlvl);
        }

        // invoke the app
        res = app(req);

        if (reslvl >= 0) {
            printobj(res, true, resspaces, reslvl);
        }

        return res;
    };
};

//
//httplogger.js ends here
