const signUpFrom = document.getElementById("sign-up-form");
const loginForm = document.getElementById("login-form");

const topSign = document.getElementById("top-sign-btn");
const topLog = document.getElementById("top-log-btn");

function toggelSignUp() {
    topSign.style.background = "cadetblue"
    topLog.style.background = "initial";
    loginForm.style.display = "none";
    signUpFrom.style.display = "block";
};
function toggelLogin() {
    topLog.style.background = "cadetblue";
    topSign.style.background = "initial"
    signUpFrom.style.display = "none";
    loginForm.style.display = "block";
};
function closeForm() {
    document.getElementById('form-back').style.display = "none";
    document.getElementById('contact-form').style.visibility = "visible";
}
function eye() {
    if (document.getElementById('pass').type == "password") {
        document.getElementById('pass').type = "text";
        document.querySelectorAll('.eye')[0].style.visibility = "visible";
        document.querySelectorAll('.eye')[1].style.visibility = "hidden";
    } else {
        document.getElementById('pass').type = "password";
        document.querySelectorAll('.eye')[0].style.visibility = "hidden";
        document.querySelectorAll('.eye')[1].style.visibility = "visible";
    }
}
function signEye() {
    if (document.getElementById('pass-sign').type == "password") {
        document.getElementById('pass-sign').type = "text";
        document.querySelectorAll('.sign-eye')[0].style.visibility = "visible";
        document.querySelectorAll('.sign-eye')[1].style.visibility = "hidden";
    } else {
        document.getElementById('pass-sign').type = "password";
        document.querySelectorAll('.sign-eye')[0].style.visibility = "hidden";
        document.querySelectorAll('.sign-eye')[1].style.visibility = "visible";
    }
}

// form validation

function setError(id, error) {
    let el = document.getElementById(id);
    el.querySelector('.inpError').innerHTML = error;
}
function clearError() {
    let ele = document.querySelectorAll('.inpError');
    ele.forEach(e => {
        e.innerHTML = "";
    });
}
function validateForm() {
    clearError();
    let returnVal = true;
    // sign up form validation
    if (signUpFrom.style.display == "block") {
        // sign up form validation
        let name = document.forms['sign-up-form']["name"].value;
        if (name.length < 3) {
            setError("sign-name", "*name length is too short.");
            returnVal = false;
        }
        let password = document.forms['sign-up-form']["password"].value;
        if (password.length < 6) {
            setError("sign-password", "*password length should be minimum 6.");
            returnVal = false;
        }
        if (!(/[A-Z]/.test(password))) {
            setError("sign-password", "*password should atleast contain a capital letter");
            returnVal = false;
        }
        if (!(/[a-z]/.test(password))) {
            setError("sign-password", "*password should atleast contain a small letter");
            returnVal = false;
        }
        if (!(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password))) {
            setError("sign-password", "*password should atleast contain a special character");
            returnVal = false;
        }
        let cnfPassword = document.forms['sign-up-form']['cnf-password'].value;
        if (cnfPassword != password) {
            setError("sign-cnfpassword", "*passwords do not match.");
            returnVal = false;
        }
    }
    return returnVal;
}
function popUp(message) {
    document.getElementById('form-submitted-cont').style.display = 'block'; // show "Form submitted" message
    document.getElementById('form-submitted-cont').style.display = 'flex';
    document.getElementById('form-submitted-message').innerHTML = message;
}
// it closes the above popup
function CloseOK() {
    document.getElementById('form-submitted-cont').style.display = 'none';
}
// signUP form error message

signUpFrom.addEventListener('submit', async function (event) {
    event.preventDefault(); // prevent default form submission
    if (!validateForm()) {
        return; // if validation fails, exit the function
    }
    const formData = {}; // create an empty object
    const formElements = this.elements; // get the form elements
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        if (element.name) {
            formData[element.name] = element.value;
        }
    }
    try {
        const response = await fetch('/signUp', { // send request to /signUp endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData) // send the JSON object
        });
        const result = await response.json(); // parse response as JSON
        if (result.success) {
            popUp("You are successfully registered.You can now proceed with login.");
        } else {
            popUp("Something went wrong! try again later.")
            console.error('Error submitting form:', result.error);
        }
    } catch (error) {
        popUp("Something went wrong! try again later.")
        console.error('Error submitting form:', error);
    }
});

// login form error message

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // prevent default form submission
    try {
        const usernameInput = document.querySelector('#email');
        const passwordInput = document.querySelector('#pass');
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        })
        const result = await response.json(); // parse response as JSON
        if (!result.success) {
            document.getElementById('login-auth-failed').innerHTML = "*Invalid username or password!";
        }
        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
          }
    } catch (error) {
        popUp("Something went wrong! try again later.")
        console.error('Error submitting form:', error);
    }
})
