const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authorize = require('../middleware/authorize')

const router = express.Router()
const prisma = new PrismaClient()

router.use(authorize)

async function canAccessBoard(userId, boardId) {
    const board = await prisma.boards.findFirst({
        where: {
            id: Number(boardId),
            member_id: {
                has: Number(userId)
            }
        }
    })

    return !!board
}

router.get('/', async (req, res) => {
    const { board_id } = req.query

    if (!board_id) {
        return res.status(400).json({ message: 'board_id is required' })
    }

    if (!(await canAccessBoard(req.authUser.sub, board_id))) {
        return res.status(403).json({ message: 'Access denied to this board' })
    }

    const notes = await prisma.notes.findMany({
        where: { board_id: Number(board_id) },
        orderBy: { created_at: 'asc' }
    })

    res.json(notes)
})

router.get('/:id', async (req, res) => {
    const { board_id } = req.query

    if (!(await canAccessBoard(req.authUser.sub, board_id))) {
        return res.status(403).json({ message: 'Access denied to this board' })
    }

    const note = await prisma.notes.findFirst({
        where: {
            id: Number(req.params.id),
            board_id: Number(board_id)
        }
    })

    if (!note) {
        return res.status(404).json({ message: 'Note not found' })
    }

    res.json(note)
})

router.post('/', async (req, res) => {
    const { board_id, note, x, y, color } = req.body

    if (!(await canAccessBoard(req.authUser.sub, board_id))) {
        return res.status(403).json({ message: 'Access denied to this board' })
    }

    const created = await prisma.notes.create({
        data: {
            board_id: Number(board_id),
            author_id: Number(req.authUser.sub),
            note: note.trim(),
            x: Number(x) || 0,
            y: Number(y) || 0,
            color: color || '#fff3a3'
        }
    })

    res.status(201).json(created)
})

router.put('/:id', async (req, res) => {
    const { board_id } = req.body

    if (!(await canAccessBoard(req.authUser.sub, board_id))) {
        return res.status(403).json({ message: 'Access denied to this board' })
    }

    const existing = await prisma.notes.findFirst({
        where: {
            id: Number(req.params.id),
            board_id: Number(board_id)
        }
    })

    if (!existing) {
        return res.status(404).json({ message: 'Note not found' })
    }

    const updated = await prisma.notes.update({
        where: { id: Number(req.params.id) },
        data: {
            note: req.body.note ? req.body.note.trim() : existing.note,
            x: req.body.x !== undefined ? Number(req.body.x) : existing.x,
            y: req.body.y !== undefined ? Number(req.body.y) : existing.y,
            color: req.body.color || existing.color
        }
    })

    res.json(updated)
})

router.delete('/:id', async (req, res) => {
    const { board_id } = req.body

    if (!(await canAccessBoard(req.authUser.sub, board_id))) {
        return res.status(403).json({ message: 'Access denied to this board' })
    }

    const existing = await prisma.notes.findFirst({
        where: {
            id: Number(req.params.id),
            board_id: Number(board_id)
        }
    })

    if (!existing) {
        return res.status(404).json({ message: 'Note not found' })
    }

    await prisma.notes.delete({ where: { id: Number(req.params.id) } })

    res.json({ message: 'Note deleted' })
})

module.exports = router