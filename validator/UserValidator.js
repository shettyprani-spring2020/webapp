let models = require("../models");
let owasp = require('owasp-password-strength-test');
let db = require("../database/UserDb");
let email_validator = require("email-validator");

numOfKeys = (post) =>{
    if(Object.keys(post).length != 4){
        return "Incorrect number of keys";
    }
    return true;
}

missingKeys = (post) =>{
    let email_address = post.email_address;
    let password = post.password;
    let first_name = post.first_name;
    let last_name = post.last_name;
    if(email_address == undefined|| password == undefined|| first_name == undefined|| last_name == undefined){
        return "Missing keys";
    }
    return true;
}

passwordStrength = (password) =>{
    let result = owasp.test(password);
    if(!result.strong){
        return result.errors;
    }
    return true;
}

emailValidator =(email_address)=>{
    return email_validator.validate(email_address);
}

emailExists = async (email_address)=>{
    let result = await db.findAll("email", email_address).then((result)=>{
        return result;
    });
    if(result.length != 0){
        return "Email already exists";
    }

    return true;
}

main = (post) =>{
    if(typeof(numOfKeys(post)) == "string"){
        return numOfKeys(post);
    }else if(typeof(missingKeys(post)) == "string"){
        return missingKeys(post);
    }else if(Array.isArray(passwordStrength(post.password))){
        return passwordStrength(post.password);
    }else if(!emailValidator(post.email_address)){
        return "Invalid email";
    }else if(typeof(emailExists(post.email_address)) == "string"){
        return emailExists(post.email);
    }else{
        return "Passed";
    }

}
module.exports =  {
    numOfKeys,
    missingKeys,
    passwordStrength,
    emailValidator,
    emailExists,
    main
};