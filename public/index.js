const signUpFrom = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");

const topSign = document.getElementById("top-sign-btn");
const topLog = document.getElementById("top-log-btn");
const googleBtn = document.querySelectorAll('.google-btn-cont')

btnLogin.addEventListener("click", () => toggleForms("login"));
btnSignup.addEventListener("click", () => toggleForms("signup"));

function toggleForms(mode) {
    const loginActive = mode === "login";
    btnLogin.classList.toggle("active", loginActive);
    btnSignup.classList.toggle("active", !loginActive);
    loginForm.classList.toggle("d-none", !loginActive);
    signUpFrom.classList.toggle("d-none", loginActive);
}

document.addEventListener("click", (e) => {
    if (e.target.matches(".eye-icon")) {
        const targetId = e.target.getAttribute("data-target");
        const input = document.getElementById(targetId);
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
            e.target.classList.toggle("fa-eye");
            e.target.classList.toggle("fa-eye-slash");
        }
    }
});

function setError(id, error) {
    let el = document.getElementById(id);
    el.innerHTML = error;
}

function validateForm() {
    document.querySelector('#signup-error').innerHTML = "";
    let returnVal = true;
    let name = document.forms['sign-up-form']["name"].value;
    if (name.length < 3) {
        setError("signup-error", "*name length is too short.");
        return false;
    }
    let password = document.forms['sign-up-form']["password"].value;
    if (password.length < 6) {
        setError("signup-error", "*password length should be minimum 6.");
        return false;
    }
    if (!(/[A-Z]/.test(password))) {
        setError("signup-error", "*password should atleast contain a capital letter");
        return false;
    }
    if (!(/[a-z]/.test(password))) {
        setError("signup-error", "*password should atleast contain a small letter");
        return false;
    }
    if (!(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password))) {
        setError("signup-error", "*password should atleast contain a special character");
        return false;
    }
    let cnfPassword = document.forms['sign-up-form']['cnf-password'].value;
    if (cnfPassword != password) {
        setError("signup-error", "*passwords do not match.");
        return false;
    }
    // }
    return returnVal;
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
            swal.fire({
                icon: 'success',
                title: 'signup successful',
                text: "You are successfully registered.You can now proceed with login.",
                confirmButtonColor: 'green',
                confirmButtonText: 'Okay'
            })
        } else {
            swal.fire({
                icon: 'info',
                title: 'failed',
                text: "Something went wrong! try again later.",
                confirmButtonColor: '#d33',
                confirmButtonText: 'Okay'
            })
            console.error('Error submitting form:', result.error);
        }
    } catch (error) {
        swal.fire({
            icon: 'info',
            title: 'Internal server error',
            text: "Something went wrong! try again later.",
            confirmButtonColor: '#d33',
            confirmButtonText: 'Okay'
        })
        console.error('Error submitting form:', error);
    }
});

// login form error message

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // prevent default form submission
    try {
        const usernameInput = document.querySelector('#login-email');
        const passwordInput = document.querySelector('#login-password');
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
        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else if (!result.success) {
            document.getElementById('login-error').innerHTML = "*Invalid username or password!";
        }
    } catch (error) {
        swal.fire({
            icon: 'info',
            title: 'Internal server error',
            text: "Something went wrong! try again later.",
            confirmButtonColor: '#d33',
            confirmButtonText: 'Okay'
        })
        console.error('Error submitting form:', error);
    }
})
