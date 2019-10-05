const title = 'Simple Title';
const options = {
    body: 'Simple piece of body text.\nSecond line of body text :)'
};
console.log("inside notification")
self.showNotification(title, options).then(function(response) {
    console.log(response)
}).catch(function(error) {
    cosole.log(error)
});