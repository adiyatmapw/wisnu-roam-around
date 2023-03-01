'use client'

import React, { useState, useEffect, useReducer } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { data } from '../city-data'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"

export default function Home() {
  const [request, setRequest] = useState<{startDate?: string, daysNum?: number, city?: string}>({})
  const [disableButton, setDisableButton] = useState<boolean>(true)
  const [error, setError] = useState<{daysNum:boolean}>({daysNum:false})
  let [itinerary, setItinerary] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkRedirect()
  }, [])


  useEffect(()=>{
    if(request.daysNum && request.daysNum>10)
    {
      setError(error => ({
        ...error, daysNum: true
      }))
    }
    else {
      setError(error => ({
        ...error, daysNum: false
      }))
    }

    if(
      request.city 
      && request.daysNum 
      && request.startDate 
      && request.daysNum <= 10
    )
    {
      setDisableButton(false)
    }
    if(request.city == "" || request.daysNum == 0 || request.startDate == "" || (request.daysNum && request.daysNum > 10))
    {
      setDisableButton(true)
    }

  },[request])


  function checkRedirect() {
    if (window.location.hostname === 'gpt-travel-advisor.vercel.app') {
      window.location.replace('https://www.roamaround.io/')
    }
  }

  async function hitAPI() {

    const isDateValid = (date: Date) => {
      return date.getTime() === date.getTime()
    }
    try {
      if (!request.city || !request.startDate || !isDateValid(new Date(request.startDate))  || !request.daysNum) return
      //setMessage('Hi! We hit our limits at the moment. Please come back tomorrow!')
      setMessage('Building itinerary...this may take 40 seconds')
      setDisableButton(true)
      setLoading(true)
      setItinerary('')

      setTimeout(() => {
        if (!loading) return
        setMessage('Getting closer ...')
      }, 2000)
      setTimeout(() => {
        if (!loading) return
        setMessage('Almost there ...')
      }, 15000)
      const response = await fetch('/api/get-itinerary', {
        method: 'POST',
        body: JSON.stringify({
          days:request.daysNum,
          city: request.city,
          startDate:request.startDate,
        })
      })
      const json = await response.json()

      const response2 = await fetch('/api/get-points-of-interest', {
        method: 'POST',
        body: JSON.stringify({
          pointsOfInterestPrompt: json.pointsOfInterestPrompt,
        })
      })
      const json2 = await response2.json()

      let pointsOfInterest = JSON.parse(json2.pointsOfInterest)
      let itinerary = json.itinerary

      pointsOfInterest.map(point => {
        itinerary = itinerary.replace(point, `[${point}](https://www.viator.com/searchResults/all?pid=P00089289&mcid=42383&medium=link&text=${encodeURIComponent(point + ' ' + request.city)})`)
      })

      setItinerary(itinerary)
      setDisableButton(false)
      setLoading(false)
    } catch (err) {
      console.log('error: ', err)
      setMessage('')
    }
  }

  let days = itinerary.split('Day')

  if (days.length > 1) {
    days.shift()
  } else {
    days[0] = "1" + days[0]
  }

  return (
    <main>
      <div className="app-container">
        <h1 style={styles.header} className="hero-header">Roam Around</h1>
        <div style={styles.formContainer} className="form-container">
          <input style={styles.input}  placeholder="City" onChange={e => setRequest(request => ({
            ...request, city: e.target.value
            }))} 
          />

          <DatePicker placeholderText={"Start Date"} minDate={new Date()}  selected={request.startDate} onChange={(date) => {
            setRequest(request => ({
              ...request, startDate: date
            }))}} 
          />
          <input type="number" style={styles.input}  placeholder="# of Days" onChange={e => setRequest(request => ({
            ...request, daysNum: Number(e.target.value)
            }))} 
          />
          {error.daysNum && <p style={styles.daysError}>At the moment we can only build itineraries for trips 10 days or less</p>}
          <button className='input-button' disabled={disableButton}  onClick={hitAPI}>Build Itinerary</button>
        </div>
        <div className="results-container">
        {
          loading && (
            <p>{message}</p>
          )
        }
        {
          itinerary && (
            <h3 style={styles.cityHeadingStyle}>Ok, we've made your itinerary for {checkCity(request.city)}</h3>
          )
        }
        {
          itinerary && days.map((day, index) => (
            <div
              style={{marginBottom: '30px'}}
              key={index}
            >
              <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: props => {
                    return <a target="_blank" rel="no-opener" href={props.href}>{props.children}</a>
                }
            }}
              >
                {`Day ${day}`}
                </ReactMarkdown>
            </div>
          ))
          }
          {/*{
            itinerary && (
              <h3 style={styles.cityHeadingStyle}> Ready to take the next step? Support us by booking <a target="_blank" rel="no-opener" href="https://bit.ly/roamaroundfoot">here</a></h3>
            )
          }*/}

        </div>
      </div>
    </main>
  )
}

function checkCity(city?: string) {
  if (!city) return
  const cityToLowerCase = city.toLowerCase()
  const cityData = data[cityToLowerCase]
  if (cityData) {
    const link = data[cityToLowerCase].link
    return (
      <a
        target="_blank"
        rel="no-referrer"
        href={link}
      >{cityToLowerCase.charAt(0).toUpperCase() + cityToLowerCase.slice(1)}</a>
    )
  } else {
    return cityToLowerCase.charAt(0).toUpperCase() + cityToLowerCase.slice(1)
  }
}

const styles = {
  cityHeadingStyle: {
    color: 'white',
    marginBottom: '20px'
  },
  header: {
    textAlign: 'center' as 'center',
    marginTop: '60px',
    color: '#c683ff',
    fontWeight: '900',
    fontFamily: 'Poppins',
    fontSize: '68px'
  },
  daysError: {
    color: "red",
    fontSize: "11px",
    margin: "5px 0"
  },
  input: {
    padding: '10px 14px',
    marginBottom: '4px',
    outline: 'none',
    fontSize: '16px',
    width: '100%',
    borderRadius: '8px'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    margin: '20px auto 0px',
    padding: '20px',
    boxShadow: '0px 0px 12px rgba(198, 131, 255, .2)',
    borderRadius: '10px'
  },
  result: {
    color: 'white'
  }
}
