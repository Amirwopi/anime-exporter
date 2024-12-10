// api/anime.js
const axios = require('axios');
const cheerio = require('cheerio');

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

module.exports = async (req, res) => {
    const { slug, quality } = req.query;

    if (!slug || !quality) {
        return res.status(400).json({ error: 'Invalid request, ensure the format is /anime/{slug}/{quality}' });
    }

    try {
        const apiResponse = await axios.get(`https://api-wopi.amirwopi.workers.dev/anime/${slug}`);
        const data = apiResponse.data;

        const selectedLink = data.DownloadLinks.find(link => link.Quality.toLowerCase() === quality.toLowerCase());

        if (!selectedLink) {
            return res.status(404).json({ error: `Quality ${quality} not found for ${slug}` });
        }

        const extractedLinks = await extractLinksFromDirectory(selectedLink.URL);
        const episodeLinks = {};
        extractedLinks.forEach((link, index) => {
            const episodeNumber = index + 1;
            episodeLinks[`ep${episodeNumber}`] = link;
        });

        return res.status(200).json({
            Slug: data.Slug,
            Title: data.Title,
            Quality: selectedLink.Quality,
            DownloadLinks: episodeLinks
        });
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return res.status(500).json({ error: 'Failed to fetch data' });
    }
};
