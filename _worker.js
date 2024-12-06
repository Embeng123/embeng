const handleSubmit = async (event, form, resultId, action) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    data.action = action;

    try {
        const response = await fetch('https://tes.bamdompul.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        const resultContainer = document.getElementById(resultId);
        resultContainer.innerHTML = '';

        if(!responseData.status) {
            resultContainer.innerHTML = <div class="error">${responseData.message}</div>;
            return;
        }

        resultContainer.innerHTML += <h3>${responseData.message}</h3>;
        if (responseData.data) {
            let dataHTML = '<pre>';
            for (let key in responseData.data) {
                if (typeof responseData.data[key] === 'object') {
                    dataHTML += ${key}:\n;
                    for (let subKey in responseData.data[key]) {
                        dataHTML +=   ${subKey}: ${responseData.data[key][subKey]}\n;
                    }
                } else {
                    dataHTML += ${key}: ${responseData.data[key]}\n;
                }
            }
            dataHTML += '</pre>';
            resultContainer.innerHTML += dataHTML;
        }
    } catch (error) {
        console.error('Error:', error);
        const resultContainer = document.getElementById(resultId);
        resultContainer.innerHTML = <div class="error">An error occurred while processing your request.</div>;
    }
};
