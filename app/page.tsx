'use client'

import React, { useState, useEffect, useReducer } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { data } from '../city-data'

export default function Home() {
  const [request, setRequest] = useState<{startDate?: string, endDate?: string, city?: string}>({})
  let [itinerary, setItinerary] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkRedirect()
  }, [])

  function checkRedirect() {
    if (window.location.hostname === 'gpt-travel-advisor.vercel.app') {
      window.location.replace('https://www.roamaround.io/')
    }
  }

  async function hitAPI() {

    const diffDate = (startDate: Date, endDate: Date) => {
      // @ts-ignore
      const diffTime = endDate - startDate;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const isDateValid = (date: Date) => {
      return date.getTime() === date.getTime()
    }
    try {
      if (!request.city || !request.startDate || !isDateValid(new Date(request.startDate))  || !request.endDate || !isDateValid(new Date(request.endDate)) ||
          new Date(request.startDate) > new Date(request.endDate)) return
      const days = diffDate(new Date(request.startDate), new Date(request.endDate)) + 1
      //setMessage('Hi! We hit our limits at the moment. Please come back tomorrow!')
      setMessage('Building itinerary...this may take 40 seconds')
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
          days,
          city: request.city
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
          }))} />
          <input type="date" style={styles.input} placeholder="Start Date" onChange={e => setRequest(request => ({
            ...request, startDate: e.target.value
          }))} />
          <input type="date" style={styles.input} min={request.startDate} placeholder="End Date" onChange={e => setRequest(request => ({
            ...request, endDate: e.target.value
          }))} />
          <button className="input-button"  onClick={hitAPI}>Build Itinerary</button>
        </div>
        <div className="results-container">
        {
          loading && (
            <p>{message}</p>
          )
        }
        {
          itinerary && (
            <h3 style={styles.cityHeadingStyle}>Ok, I've made your itinerary for {checkCity(request.city)}</h3>
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
              <h3 style={styles.cityHeadingStyle}> I've done the hard work, the next step is easy.  <a target="_blank" rel="no-opener" href="https://bit.ly/roamaroundfoot"> Book here</a></h3>
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
