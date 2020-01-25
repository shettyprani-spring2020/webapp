let models = require("../models");
let owasp = require('owasp-password-strength-test');
let db = require("../database/UserDb");
let email_validator = require("email-validator");

// Number of keys for new user should be 4
numOfKeys = (post) =>{
    if(Object.keys(post).length != 4){
        return true;
    }
    return false;
}

// Should have all the required fields
missingKeys = (post) =>{
    let email_address = post.email_address;
    let password = post.password;
    let first_name = post.first_name;
    let last_name = post.last_name;
    if(email_address == undefined|| password == undefined|| first_name == undefined|| last_name == undefined){
        return true;
    }
    return false;
}

// should match minimum password criteria
passwordStrength = (password) =>{
    let result = owasp.test(password);
    if(!result.strong){
        return result.errors;
    }
    return true;
}

// should be a valid email
emailValidator =(email_address)=>{
    return email_validator.validate(email_address);
}

// check if email already exists
emailExists =  async (email_address) =>{
    let result  = await db.findAll("email_address", email_address).then((result)=>{
        return result;
    });
    if(result.length != 0){
        return true;
    }
    return false;
}

// run all validations for post request
main = async (post) =>{
    console.log("Validating");
    if(numOfKeys(post)){
        return "Incorrect number of keys";
    }else if(missingKeys(post)){
        return "Missing keys";
    }else if(Array.isArray(passwordStrength(post.password))){
        return passwordStrength(post.password);
    }else if(!emailValidator(post.email_address)){
        return "Invalid email";
    }else if(await emailExists(post.email_address)){
        return "Email address already in use";
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