import api from "./api";


const downloadFile = async (url, filename) => {
    const response = await api.get(url, {
        responseType: "blob",
    });

    const blob = new Blob([response.data]);

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
};

const reportService = {

    downloadPDF(videoId) {
        return downloadFile(
            `/api/reports/${videoId}/pdf`,
            `ClipMind_Report_${videoId}.pdf`
        );
    },

    downloadCSV(videoId) {
        return downloadFile(
            `/api/reports/${videoId}/csv`,
            `KeyMoments_${videoId}.csv`
        );
    },

    downloadAnalyticsCSV(videoId) {
        return downloadFile(
            `/api/reports/${videoId}/analytics/csv`,
            `Analytics_${videoId}.csv`
        );
    }

};

export default reportService;