const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

async function extractLinksFromDirectory(directoryUrl) {
    try {
        const response = await axios.get(directoryUrl);
        const html = response.data;
        const $ = cheerio.load(html);
        const links = [];

        $('#directory-listing a').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                links.push(`https://rkdl1.mementoanime.ir${href}`);
            }
        });

        return links;
    } catch (error) {
        console.error('Error fetching directory:', error);
        return [];
    }
}

app.get('/', async (req, res) => {
    // دریافت `slug` و `quality` از query parameters
    const { episodeid, quality } = req.query;

    if (!episodeid || !quality) {
        return res.status(400).json({ error: 'Both slug and quality parameters are required' });
    }

    try {
        const apiResponse = await axios.get(`https://api-wopi.amirwopi.workers.dev/anime/${episodeid}`);
        const data = apiResponse.data;

        const selectedLink = data.DownloadLinks.find(link => link.Quality.toLowerCase() === quality.toLowerCase());

        if (!selectedLink) {
            return res.status(404).json({ error: `Quality ${quality} not found for ${episodeid}` });
        }

        const extractedLinks = await extractLinksFromDirectory(selectedLink.URL);

        const episodeLinks = {};
        extractedLinks.forEach((link, index) => {
            const episodeNumber = index + 1;
            episodeLinks[`${episodeid}-episode-${episodeNumber}`] = link;
        });

        res.json({
            Slug: data.Slug,
            Title: data.Title,
            Quality: selectedLink.Quality,
            DownloadLinks: episodeLinks
        });
    } catch (error) {
        console.error('Error fetching data from API:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
