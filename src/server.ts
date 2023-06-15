import express, { request } from 'express';
import cors from 'cors'

import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes, convertMinutesToHourString } from './utils/times';

const app = express()

const port = process.env.PORT || 3333

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/games', async (req, res) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    Ads: true
                }
            }
        }
    })

    return res.json(games)
})

app.post('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id
    const body: any = req.body

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHourStringToMinutes( body.hourStart),
            hourEnd: convertHourStringToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    })

    return res.status(201).json(ad)
})

app.get('/games/:id/ads', async (req, res) => {
    const gameId = req.params.id

    const ads = await prisma.ad.findMany({
        select:{
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            gameId
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    res.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd)
        }
    }))    
})

app.get('/ads/:id/discord', async (req, res) => {
    const adId = req.params.id
    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where: {
            id: adId
        }
    })

    res.json({
        discord: ad.discord
    })
})

app.listen(3333)