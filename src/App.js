import React,{Component} from 'react';
import Navigation from './components/Navigation/Navigation.js';
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js';
import Signin from './components/Signin/Signin.js';
import Logo from './components/Logo/Logo.js';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm.js';
import Rank from './components/Rank/Rank.js';
import Register from './components/Register/Register.js';
import ParticlesBg from 'particles-bg';
import './App.css';
import 'tachyons';


class App extends Component {
  constructor(){
    super()
    this.state = {
      input : '',
      imageURL : '',
      box : {},
      route: 'signin',
      isSignedIn : false,
      user:{
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      }
    }
  }

  loadUser = (data) => {
    this.setState({user:{
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    // console.log(clarifaiFace)
    const image = document.getElementById('inputImage')
    const width = Number(image.width);
    const height = Number(image.height);
    console.log(height, width);
    return{
        leftCol: clarifaiFace.left_col*width,
        topRow: clarifaiFace.top_row*height,
        rightCol: width - (clarifaiFace.right_col*width),
        bottomRow: height - (clarifaiFace.bottom_row*height)
    }
  }

  displayFaceBox = (box) => {
    console.log(box);
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input : event.target.value});
  }

  onButtonSubmit = () =>{
    this.setState({imageURL : this.state.input});

    /*Clarifai API*/
    const PAT = 'a8c2645560214a319cc7ac8c3fc0ddde';
    const USER_ID = 'amratansh12';       
    const APP_ID = 'my-first-application';
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';    
    const IMAGE_URL = this.state.input;

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };

    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions)
        .then(response => response.json())
        .then(result => {
          if(result){
            fetch('http://localhost:3000/image', {
              method: 'put',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                id: this.state.user.id
              }).then(response => response.json())
              .then(count => {
                this.setState({user: {
                  entries: count
                }})
              })
            })
          }
          this.displayFaceBox(this.calculateFaceLocation(result))
        })
        .catch(error => console.log('error', error));  
  }

  onRouteChange = (route) => {
    if(route === 'signout'){
        this.setState({isSignedIn : false})
    }
    else if(route === 'home'){
        this.setState({isSignedIn : true})
    }
    this.setState({route : route});
  }

  render(){
    const {isSignedIn, imageURL, route, box} = this.state;
    return(
        <div className="App">
          <ParticlesBg type="cobweb" bg={true} />
          <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
          { route === 'home'
            ?   <div>
                  <Logo />
                  <Rank name={this.state.user.name} entries={this.state.user.entries}/>
                  <ImageLinkForm 
                    onInputChange={this.onInputChange} 
                    onButtonSubmit={this.onButtonSubmit}
                  />
                  <FaceRecognition box={box} imageURL={imageURL}/>
                </div>
            :
            (
                this.state.route === 'signin'
                ?   <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
                :   <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            )
          }
        </div>
    );
  };
}

export default App;
