const getById = (id) => {
    return document.getElementById(id);
}


const password = getById("password");
const confirmPassword = getById("confirm-password");
const form = getById("form");
const loader = getById("loader");
const container = getById("container");
const button = getById("submit");
const success = getById("success");
const error = getById("error");


error.style.display = "none";
success.style.display = "none";
container.style.display = "none";

let token, userId;
const passRegex =  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/;

window.addEventListener('DOMContentLoaded', async () => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => {
            return searchParams.get(prop)
        }
    });
    token = params.token,
    userId = params.userId

    console.log(token)

    const res = await fetch("/auth/verify-password-reset-token", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({ token, userId })
    })

    if(!res.ok) {
        const {error} = await res.json()
        loader.innerText = error
        return 
    }

    console.log(res.status)

    loader.style.display = "none";
    container.style.display = "block";
});

const displayError = (errorMessage) => {
    success.style.display = "none";
    error.innerText = errorMessage;
    error.style.display = "block"
}

const displaySuccess = (successMessage) => {
    error.style.display = "none";
    success.innerText = successMessage;
    success.style.display = "block"
}

const handleSubmit = async (evt) => {
    evt.preventDefault();
    
    //validate
    if(!password.value.trim()) {
        return displayError("Password is missing")
    }

    if(!passRegex.test(password.value)) {
        return displayError("Password is too simple, use alpha numeric with special characters!");
    }

    if(password.value !== confirmPassword.value ){
        return displayError("Password do not match")
    }

    button.disabled = true;
    button.innerText = "Please Wait...";

    //handle the submission
    const res = await fetch("/auth/update-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
            token,
            userId,
            password: password.value
        }),
    });
    button.disabled = false;
    button.innerText = "Reset Password";

    if(!res.ok) {
        const {error} = await res.json()
        return displayError(error)
    }

    displaySuccess("Your password has been updated");
    password.value = "";
    confirmPassword.value = "";

};

form.addEventListener("submit", handleSubmit)