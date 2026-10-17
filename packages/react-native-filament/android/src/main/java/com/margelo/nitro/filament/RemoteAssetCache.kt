package com.margelo.nitro.filament

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Deferred
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

object RemoteAssetCache {
  private const val TIMEOUT_MS = 30_000
  private val downloads = ConcurrentHashMap<String, Deferred<File>>()

  suspend fun fileFor(url: String, cacheDir: File): File {
    val download = CompletableDeferred<File>()
    val existing = downloads.putIfAbsent(url, download)
    if (existing != null) return existing.await()
    try {
      download.complete(this.download(url, File(cacheDir, "react-native-filament")))
    } catch (error: Throwable) {
      downloads.remove(url, download)
      download.completeExceptionally(error)
    }
    return download.await()
  }

  private fun download(url: String, directory: File): File {
    directory.mkdirs()
    val target = File(directory, sha256(url))
    val part = File.createTempFile("download", ".part", directory)
    try {
      val connection = URL(url).openConnection() as HttpURLConnection
      connection.connectTimeout = TIMEOUT_MS
      connection.readTimeout = TIMEOUT_MS
      try {
        if (connection.responseCode !in 200..299) {
          throw IOException("Downloading $url failed with HTTP ${connection.responseCode}.")
        }
        connection.inputStream.use { input -> part.outputStream().use { input.copyTo(it) } }
      } finally {
        connection.disconnect()
      }
      if (!part.renameTo(target)) throw IOException("Could not move the download of $url into the cache.")
      return target
    } finally {
      part.delete()
    }
  }

  private fun sha256(value: String): String =
    MessageDigest.getInstance("SHA-256").digest(value.toByteArray()).joinToString("") { "%02x".format(it) }
}
